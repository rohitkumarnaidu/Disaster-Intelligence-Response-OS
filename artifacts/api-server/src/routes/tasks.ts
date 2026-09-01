import { Router } from "express";
import { db, tasks, cases, auditEvents } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";
import { transitionTask } from "../services/task-state-machine";
import { transitionCase } from "../services/case-state-machine";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.priority));
  res.json(allTasks.map(t => ({
    ...t,
    slaLabel: t.dueAt ? `Due ${new Date(t.dueAt).toLocaleTimeString()}` : 'No SLA',
    escalation: t.escalationAt && new Date(t.escalationAt) < new Date()
  })));
});

router.post("/", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Commander", "Response Coordinator"), async (req, res) => {
  const { caseId, title, assignedTeam, assignedUser, version } = req.body;
  const id = `task-${Date.now()}`;
  
  try {
    const [c] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!c) return res.status(404).json({ error: { message: "Case not found" } });

    const priority = c.priorityScore || 50;
    let hours = 8;
    if (priority >= 75) hours = 0.5;
    else if (priority >= 45) hours = 2;

    const dueAt = new Date(Date.now() + hours * 3600 * 1000);
    const escalationAt = new Date(dueAt.getTime() + 1800 * 1000);

    const newTask = {
      id,
      caseId,
      title,
      assignedTeam,
      assignedUser,
      priority: Math.round(priority),
      status: assignedUser || assignedTeam ? "ASSIGNED" : "UNASSIGNED",
      createdAt: new Date(),
      dueAt,
      escalationAt,
      version: 1,
    };

    const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");

    let taskCreatedEvent: any = null;
    let auditEventObj: any = null;

    await db.transaction(async (tx: any) => {
      await tx.insert(tasks).values(newTask);
      
      const auditId = `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await tx.insert(auditEvents).values({
        id: auditId,
        actorId: req.session.userId,
        entityType: "TASK",
        entityId: id,
        action: "CREATED",
        metadata: { caseId, title, assignedTeam, assignedUser },
        timestamp: new Date()
      });

      taskCreatedEvent = await enqueueOutboxEvent(tx, {
        eventType: "TASK_CREATED",
        entityType: "TASK",
        entityId: id,
        incidentId: c.incidentId,
        version: 1,
        actorId: req.session.userId,
        payload: {
          ...newTask,
          incidentId: c.incidentId,
          createdAt: newTask.createdAt.toISOString(),
          dueAt: dueAt.toISOString(),
          escalationAt: escalationAt.toISOString(),
        },
      });

      auditEventObj = await enqueueOutboxEvent(tx, {
        eventType: "AUDIT_EVENT_CREATED",
        entityType: "AUDIT",
        entityId: id,
        incidentId: c.incidentId,
        version: 1,
        actorId: req.session.userId,
        payload: {
          id: auditId,
          action: "CREATED",
          entityType: "TASK",
          entityId: id,
          actorId: req.session.userId,
          metadata: { caseId },
          timestamp: new Date().toISOString(),
        },
      });
    });

    if (taskCreatedEvent) dispatchCommittedEvent(taskCreatedEvent).catch(() => {});
    if (auditEventObj) dispatchCommittedEvent(auditEventObj).catch(() => {});

    // Transition the case to TASKED
    await transitionCase(caseId, "TASKED", req.session.userId!, version || c.version, "Task assigned");

    res.status(201).json(newTask);
  } catch (error: any) {
    if (error.code === "VERSION_CONFLICT" || error.code === "INVALID_TRANSITION") {
      res.status(409).json({ error });
    } else {
      res.status(500).json({ error: { message: error.message } });
    }
  }
});

router.patch("/:id", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Commander", "Field Responder"), async (req, res) => {
  const taskId = req.params.id as string;
  const { status, version } = req.body;

  try {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!t) return res.status(404).json({ error: { message: "Task not found" } });

    const updatedTask = await transitionTask(taskId, status, req.session.userId!, version || t.version);
    
    // Auto-transition case if field verified
    if (status === "VERIFIED") {
      const [c] = await db.select().from(cases).where(eq(cases.id, t.caseId));
      if (c) await transitionCase(c.id, "FIELD_VERIFIED", req.session.userId!, c.version, "Field verified via task");
    }

    res.json({ success: true, version: updatedTask.version });
  } catch (error: any) {
    if (error.code === "VERSION_CONFLICT" || error.code === "INVALID_TRANSITION") {
      res.status(409).json({ error });
    } else {
      res.status(500).json({ error: { message: error.message } });
    }
  }
});

export default router;

