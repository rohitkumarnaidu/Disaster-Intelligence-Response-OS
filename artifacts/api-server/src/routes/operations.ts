import { Router } from "express";
import { db, incidents, cases, tasks, detections, criticalAssets, auditEvents } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/command/summary", async (req, res) => {
  // get active incident
  const [incident] = await db.select().from(incidents).where(eq(incidents.status, "Active")).orderBy(desc(incidents.updatedAt)).limit(1);
  if (!incident) return res.json({ metrics: {}, cases: [], tasks: [], activity: [] });

  const allCases = await db.select().from(cases).leftJoin(detections, eq(cases.detectionId, detections.id)).leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id)).where(eq(cases.incidentId, incident.id)).orderBy(desc(cases.priorityScore));
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.priority));
  const recentActivity = await db.select().from(auditEvents).orderBy(desc(auditEvents.timestamp)).limit(5);

  const backlog = allCases.filter(c => c.cases.status === 'NEEDS_REVIEW' || c.cases.status === 'DETECTED').length;
  const highPriority = allCases.filter(c => (c.cases.priorityScore || 0) >= 75).length;
  const openTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CLOSED').length;
  const overdueTasks = allTasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'COMPLETED').length;
  
  res.json({
    incident,
    metrics: { backlog, highPriority, openTasks, overdueTasks, confirmationRate: 100, slaCompliance: 100 },
    cases: allCases.map(c => ({
      id: c.cases.id,
      title: `${c.detections?.class || 'Unknown'} near ${c.critical_assets?.name || 'Asset'}`,
      assetName: c.critical_assets?.name,
      severity: c.detections?.severity,
      priorityScore: c.cases.priorityScore,
      reviewState: c.cases.reviewState,
      confidence: c.detections?.confidence,
    })).slice(0, 5),
    tasks: allTasks.slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      assignedUser: t.assignedUser || "Unassigned",
      slaLabel: t.dueAt ? `Due ${new Date(t.dueAt).toLocaleTimeString()}` : "No SLA",
      escalation: t.escalationAt && new Date(t.escalationAt) < new Date(),
      status: t.status,
    })),
    activity: recentActivity.map(a => ({
      title: `${a.action} on ${a.entityType} ${a.entityId}`,
      time: new Date(a.timestamp).toLocaleTimeString(),
      tone: a.action === "CREATED" ? "positive" : "neutral",
    }))
  });
});

router.post("/audit", async (req, res) => {
  const { action, entityType, entityId, details } = req.body;
  if (!action || !entityType || !entityId) return res.status(400).json({ error: "Missing required fields" });
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    entityType,
    entityId,
    action,
    actorId: req.session?.userId || "unknown",
    timestamp: new Date(),
    metadata: details ? { details } : {}
  });
  res.json({ success: true });
});

export default router;