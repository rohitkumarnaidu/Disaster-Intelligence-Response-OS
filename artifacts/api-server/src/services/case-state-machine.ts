import { db, cases, caseStatusHistory, auditEvents } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { enqueueOutboxEvent, dispatchCommittedEvent } from "../realtime/outbox";
import { EventType } from "../realtime/contracts";

export const VALID_CASE_TRANSITIONS: Record<string, string[]> = {
  "DETECTED": ["NEEDS_REVIEW"],
  "NEEDS_REVIEW": ["CONFIRMED", "REJECTED", "UNCERTAIN"],
  "CONFIRMED": ["PRIORITIZED", "TASKED"],
  "PRIORITIZED": ["TASKED"],
  "TASKED": ["IN_PROGRESS"],
  "IN_PROGRESS": ["FIELD_VERIFIED", "ACTIONED"],
  "FIELD_VERIFIED": ["ACTIONED"],
  "ACTIONED": ["CLOSED"],
  "UNCERTAIN": ["CLOSED"],
  "REJECTED": ["CLOSED"],
  "CLOSED": []
};

const VALID_TRANSITIONS = VALID_CASE_TRANSITIONS;

export async function transitionCase(
  caseId: string,
  newStatus: string,
  userId: string,
  expectedVersion: number,
  notes?: string,
  extraUpdates: any = {}
) {
  let domainEvent: any = null;
  let auditEventObj: any = null;

  const updatedRecord = await db.transaction(async (tx: any) => {
    const [c] = await tx.select().from(cases).where(eq(cases.id, caseId));
    
    if (!c) {
      throw new Error("Case not found");
    }
    
    if (c.version !== expectedVersion) {
      throw { code: "VERSION_CONFLICT", message: "The record changed on the server.", serverVersion: c.version, serverRecord: c };
    }

    const currentStatus = c.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowed.includes(newStatus)) {
      throw { code: "INVALID_TRANSITION", message: `Cannot transition from ${currentStatus} to ${newStatus}` };
    }

    const res = await tx.update(cases).set({
      status: newStatus,
      version: expectedVersion + 1,
      updatedAt: new Date(),
      ...extraUpdates
    }).where(and(eq(cases.id, caseId), eq(cases.version, expectedVersion))).returning();

    if (res.length === 0) {
      throw { code: "VERSION_CONFLICT", message: "The record changed concurrently.", serverVersion: c.version, serverRecord: c };
    }

    const historyId = `csh-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await tx.insert(caseStatusHistory).values({
      id: historyId,
      caseId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      user: userId,
      reason: notes,
      timestamp: new Date()
    });

    const auditId = `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const auditAction = `TRANSITIONED_TO_${newStatus}`;
    const auditMeta = { from: currentStatus, to: newStatus, notes, priorityScore: extraUpdates.priorityScore };

    await tx.insert(auditEvents).values({
      id: auditId,
      actorId: userId,
      entityType: "CASE",
      entityId: caseId,
      action: auditAction,
      metadata: auditMeta,
      timestamp: new Date()
    });

    // Map to specific domain event type
    let eventType: EventType = "CASE_STATUS_CHANGED";
    if (newStatus === "CONFIRMED") eventType = "CASE_CONFIRMED";
    else if (newStatus === "REJECTED") eventType = "CASE_REJECTED";
    else if (newStatus === "UNCERTAIN") eventType = "CASE_UNCERTAIN";
    else if (newStatus === "TASKED") eventType = "CASE_TASKED";
    else if (newStatus === "CLOSED") eventType = "CASE_CLOSED";

    // Enqueue transactional outbox event
    domainEvent = await enqueueOutboxEvent(tx, {
      eventType,
      entityType: "CASE",
      entityId: caseId,
      incidentId: c.incidentId,
      version: expectedVersion + 1,
      actorId: userId,
      payload: {
        id: caseId,
        incidentId: c.incidentId,
        status: newStatus,
        previousStatus: currentStatus,
        reviewState: extraUpdates.reviewState || c.reviewState,
        priorityScore: extraUpdates.priorityScore ?? c.priorityScore,
        priorityBreakdown: extraUpdates.priorityBreakdown ?? c.priorityBreakdown,
        version: expectedVersion + 1,
        notes,
        updatedAt: new Date().toISOString(),
      },
    });

    // Also enqueue audit outbox event
    auditEventObj = await enqueueOutboxEvent(tx, {
      eventType: "AUDIT_EVENT_CREATED",
      entityType: "AUDIT",
      entityId: caseId,
      incidentId: c.incidentId,
      version: 1,
      actorId: userId,
      payload: {
        id: auditId,
        action: auditAction,
        entityType: "CASE",
        entityId: caseId,
        actorId: userId,
        metadata: auditMeta,
        timestamp: new Date().toISOString(),
      },
    });

    return res[0];
  });

  // Post-commit broadcast (non-blocking)
  if (domainEvent) {
    dispatchCommittedEvent(domainEvent).catch(() => {});
  }
  if (auditEventObj) {
    dispatchCommittedEvent(auditEventObj).catch(() => {});
  }

  return updatedRecord;
}

