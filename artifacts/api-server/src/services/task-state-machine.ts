import { db, tasks, auditEvents } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const VALID_TRANSITIONS: Record<string, string[]> = {
  "UNASSIGNED": ["ASSIGNED"],
  "ASSIGNED": ["IN_PROGRESS", "UNASSIGNED"],
  "IN_PROGRESS": ["BLOCKED", "COMPLETED", "VERIFIED"],
  "BLOCKED": ["IN_PROGRESS", "UNASSIGNED"],
  "COMPLETED": ["VERIFIED", "CLOSED"],
  "VERIFIED": ["CLOSED"],
  "CLOSED": []
};

export async function transitionTask(
  taskId: string,
  newStatus: string,
  userId: string,
  expectedVersion: number,
  extraUpdates: any = {}
) {
  return await db.transaction(async (tx) => {
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

    const res = await tx.update(tasks).set({
      status: newStatus,
      version: expectedVersion + 1,
      completedAt: newStatus === "COMPLETED" || newStatus === "VERIFIED" || newStatus === "CLOSED" ? new Date() : null,
      ...extraUpdates
    }).where(and(eq(tasks.id, taskId), eq(tasks.version, expectedVersion))).returning();

    if (res.length === 0) {
      throw { code: "VERSION_CONFLICT", message: "The record changed concurrently.", serverVersion: t.version, serverRecord: t };
    }

    await tx.insert(auditEvents).values({
      id: `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      actorId: userId,
      entityType: "TASK",
      entityId: taskId,
      action: `STATUS_UPDATED`,
      metadata: { from: currentStatus, to: newStatus },
      timestamp: new Date()
    });

    return res[0];
  });
}
