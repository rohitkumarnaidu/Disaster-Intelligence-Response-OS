import { db, cases, caseStatusHistory, auditEvents } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const VALID_TRANSITIONS: Record<string, string[]> = {
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

export async function transitionCase(
  caseId: string,
  newStatus: string,
  userId: string,
  expectedVersion: number,
  notes?: string,
  extraUpdates: any = {}
) {
  return await db.transaction(async (tx) => {
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

    await tx.insert(caseStatusHistory).values({
      id: `csh-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      caseId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      user: userId,
      reason: notes,
      timestamp: new Date()
    });

    await tx.insert(auditEvents).values({
      id: `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actorId: userId,
      entityType: "CASE",
      entityId: caseId,
      action: `TRANSITIONED_TO_${newStatus}`,
      metadata: { from: currentStatus, to: newStatus, notes },
      timestamp: new Date()
    });

    return res[0];
  });
}
