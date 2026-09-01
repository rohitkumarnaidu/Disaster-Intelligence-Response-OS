import { db, tasks, cases, auditEvents } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { enqueueOutboxEvent, dispatchCommittedEvent } from "../realtime/outbox";
import { EventType } from "../realtime/contracts";

export const VALID_TASK_TRANSITIONS: Record<string, string[]> = {
  "UNASSIGNED": ["ASSIGNED"],
  "ASSIGNED": ["IN_PROGRESS", "UNASSIGNED"],
  "IN_PROGRESS": ["BLOCKED", "COMPLETED", "VERIFIED"],
  "BLOCKED": ["IN_PROGRESS", "UNASSIGNED"],
  "COMPLETED": ["VERIFIED", "CLOSED"],
  "VERIFIED": ["CLOSED"],
  "CLOSED": []
};

const VALID_TRANSITIONS = VALID_TASK_TRANSITIONS;

export async function transitionTask(
  taskId: string,
  newStatus: string,
  userId: string,
  expectedVersion: number,
  extraUpdates: any = {}
) {
  let domainEvent: any = null;
  let auditEventObj: any = null;

  const updatedRecord = await db.transaction(async (tx: any) => {
    const [t] = await tx.select().from(tasks).where(eq(tasks.id, taskId));
    
    if (!t) throw new Error("Task not found");
    
    if (t.version !== expectedVersion) {
      throw { code: "VERSION_CONFLICT", message: "The record changed on the server.", serverVersion: t.version, serverRecord: t };
    }

    const currentStatus = t.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowed.includes(newStatus)) {
      throw { code: "INVALID_TRANSITION", message: `Cannot transition from ${currentStatus} to ${newStatus}` };
    }

    const [c] = await tx.select().from(cases).where(eq(cases.id, t.caseId));

    const res = await tx.update(tasks).set({
      status: newStatus,
      version: expectedVersion + 1,
      completedAt: newStatus === "COMPLETED" || newStatus === "VERIFIED" || newStatus === "CLOSED" ? new Date() : null,
      ...extraUpdates
    }).where(and(eq(tasks.id, taskId), eq(tasks.version, expectedVersion))).returning();

    if (res.length === 0) {
      throw { code: "VERSION_CONFLICT", message: "The record changed concurrently.", serverVersion: t.version, serverRecord: t };
    }

    const auditId = `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const auditAction = `TASK_TRANSITIONED_TO_${newStatus}`;
    const auditMeta = { from: currentStatus, to: newStatus, ...extraUpdates };

    await tx.insert(auditEvents).values({
      id: auditId,
      actorId: userId,
      entityType: "TASK",
      entityId: taskId,
      action: auditAction,
      metadata: auditMeta,
      timestamp: new Date()
    });

    let eventType: EventType = "TASK_STATUS_CHANGED";
    if (newStatus === "ASSIGNED") eventType = "TASK_ASSIGNED";
    else if (newStatus === "COMPLETED") eventType = "TASK_COMPLETED";
    else if (newStatus === "VERIFIED") eventType = "TASK_VERIFIED";
    else if (newStatus === "CLOSED") eventType = "TASK_CLOSED";
    else if (newStatus === "IN_PROGRESS") eventType = "TASK_STARTED";
    else if (newStatus === "BLOCKED") eventType = "TASK_BLOCKED";

    // Enqueue transactional outbox event
    domainEvent = await enqueueOutboxEvent(tx, {
      eventType,
      entityType: "TASK",
      entityId: taskId,
      incidentId: c?.incidentId || null,
      version: expectedVersion + 1,
      actorId: userId,
      payload: {
        id: taskId,
        caseId: t.caseId,
        incidentId: c?.incidentId || null,
        title: t.title,
        status: newStatus,
        previousStatus: currentStatus,
        assignedUser: extraUpdates.assignedUser || t.assignedUser,
        assignedTeam: extraUpdates.assignedTeam || t.assignedTeam,
        priority: t.priority,
        version: expectedVersion + 1,
        dueAt: t.dueAt,
        escalationAt: t.escalationAt,
        completedAt: res[0].completedAt,
        updatedAt: new Date().toISOString(),
      },
    });

    // Enqueue audit outbox event
    auditEventObj = await enqueueOutboxEvent(tx, {
      eventType: "AUDIT_EVENT_CREATED",
      entityType: "AUDIT",
      entityId: taskId,
      incidentId: c?.incidentId || null,
      version: 1,
      actorId: userId,
      payload: {
        id: auditId,
        action: auditAction,
        entityType: "TASK",
        entityId: taskId,
        actorId: userId,
        metadata: auditMeta,
        timestamp: new Date().toISOString(),
      },
    });

    return res[0];
  });

  // Post-commit dispatch
  if (domainEvent) {
    dispatchCommittedEvent(domainEvent).catch(() => {});
  }
  if (auditEventObj) {
    dispatchCommittedEvent(auditEventObj).catch(() => {});
  }

  return updatedRecord;
}

