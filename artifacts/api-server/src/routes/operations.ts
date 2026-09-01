import { Router } from "express";
import { db, incidents, cases, tasks, detections, criticalAssets, auditEvents } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/command/summary", async (req, res) => {
  // Check if specific incidentId requested, otherwise find active incident with cases or latest
  const reqIncidentId = req.query.incidentId as string;
  let incident: any = null;

  if (reqIncidentId) {
    const [found] = await db.select().from(incidents).where(eq(incidents.id, reqIncidentId)).limit(1);
    incident = found;
  }

  if (!incident) {
    // Prefer any active/available incident with cases attached
    const allIncidents = await db.select().from(incidents).orderBy(desc(incidents.updatedAt)).limit(10);
    for (const inc of allIncidents) {
      const caseCount = await db.select().from(cases).where(eq(cases.incidentId, inc.id)).limit(1);
      if (caseCount.length > 0) {
        incident = inc;
        break;
      }
    }
    if (!incident && allIncidents.length > 0) {
      incident = allIncidents[0];
    }
  }

  if (!incident) return res.json({ metrics: { backlog: 0, highPriority: 0, openTasks: 0, overdueTasks: 0, confirmationRate: 0, slaCompliance: 100 }, cases: [], tasks: [], activity: [] });

  const allCases = await db.select().from(cases).leftJoin(detections, eq(cases.detectionId, detections.id)).leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id)).where(eq(cases.incidentId, incident.id)).orderBy(desc(cases.priorityScore));
  const allTasks = await db.select().from(tasks).orderBy(desc(tasks.priority));
  const recentActivity = await db.select().from(auditEvents).orderBy(desc(auditEvents.timestamp)).limit(5);

  const backlog = allCases.filter(c => c.cases.status === 'NEEDS_REVIEW' || c.cases.status === 'DETECTED').length;
  const highPriority = allCases.filter(c => (c.cases.priorityScore || 0) >= 75).length;
  const openTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CLOSED').length;
  const overdueTasks = allTasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'COMPLETED').length;

  // Compute real confirmation rate from reviewed cases
  const reviewedCases = allCases.filter(c => ['CONFIRMED', 'REJECTED', 'UNCERTAIN'].includes(c.cases.reviewState));
  const confirmedCases = allCases.filter(c => c.cases.reviewState === 'CONFIRMED');
  const confirmationRate = reviewedCases.length > 0
    ? Math.round((confirmedCases.length / reviewedCases.length) * 100)
    : 0;

  // Compute real SLA compliance from completed tasks
  const resolvedTasks = allTasks.filter(t => t.completedAt && (t.status === 'COMPLETED' || t.status === 'CLOSED' || t.status === 'VERIFIED'));
  const onTimeTasks = resolvedTasks.filter(t => t.dueAt && t.completedAt && new Date(t.completedAt) <= new Date(t.dueAt));
  const slaCompliance = resolvedTasks.length > 0
    ? Math.round((onTimeTasks.length / resolvedTasks.length) * 100)
    : 100;
  
  res.json({
    incident,
    metrics: { backlog, highPriority, openTasks, overdueTasks, confirmationRate, slaCompliance },
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
  const { action, entityType, entityId, details, incidentId } = req.body;
  if (!action || !entityType || !entityId) return res.status(400).json({ error: "Missing required fields" });
  
  const id = crypto.randomUUID();
  const actorId = req.session?.userId || "unknown";
  const timestamp = new Date();
  const metadata = details ? { details } : {};

  const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");
  let auditEventObj: any = null;

  await db.transaction(async (tx: any) => {
    await tx.insert(auditEvents).values({
      id,
      entityType,
      entityId,
      action,
      actorId,
      timestamp,
      metadata
    });

    auditEventObj = await enqueueOutboxEvent(tx, {
      eventType: "AUDIT_EVENT_CREATED",
      entityType: "AUDIT",
      entityId,
      incidentId: incidentId || null,
      version: 1,
      actorId,
      payload: {
        id,
        action,
        entityType,
        entityId,
        actorId,
        metadata,
        timestamp: timestamp.toISOString(),
      },
    });
  });

  if (auditEventObj) dispatchCommittedEvent(auditEventObj).catch(() => {});

  res.json({ success: true });
});

/**
 * GET /api/entities/:id/lineage
 * General entity lineage resolution endpoint
 */
router.get("/entities/:id/lineage", async (req, res) => {
  const entityId = req.params.id as string;

  // Check if case
  const [caseRow] = await db.select().from(cases).where(eq(cases.id, entityId));
  if (caseRow) {
    const { detections, criticalAssets, imageryAssets, processingJobs, evidence } = await import("@workspace/db");
    const [c] = await db.select().from(cases)
      .leftJoin(detections, eq(cases.detectionId, detections.id))
      .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
      .where(eq(cases.id, entityId));

    const [incident] = await db.select().from(incidents).where(eq(incidents.id, caseRow.incidentId));
    let imageryAsset: any = null;
    if (c?.detections?.imageryId) {
      const [img] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, c.detections.imageryId));
      imageryAsset = img;
    }

    let processingJob: any = null;
    if (c?.detections?.processingJobId) {
      const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, c.detections.processingJobId));
      processingJob = job;
    }

    const caseEvidence = await db.select().from(evidence).where(eq(evidence.caseId, entityId));
    const caseAudit = await db.select().from(auditEvents).where(eq(auditEvents.entityId, entityId)).orderBy(desc(auditEvents.timestamp));

    return res.json({
      entityType: "CASE",
      case: caseRow,
      incident,
      detection: c?.detections || null,
      criticalAsset: c?.critical_assets || null,
      processingJob,
      imageryAsset,
      evidence: caseEvidence,
      auditTrail: caseAudit,
    });
  }

  // Check if incident
  const [incidentRow] = await db.select().from(incidents).where(eq(incidents.id, entityId));
  if (incidentRow) {
    const incidentAudit = await db.select().from(auditEvents).where(eq(auditEvents.entityId, entityId)).orderBy(desc(auditEvents.timestamp));
    return res.json({
      entityType: "INCIDENT",
      incident: incidentRow,
      auditTrail: incidentAudit,
    });
  }

  res.status(404).json({ error: { code: "NOT_FOUND", message: `Entity ${entityId} not found` } });
});

export default router;