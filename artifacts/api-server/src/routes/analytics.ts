import { Router } from "express";
import { db, cases, tasks, detections, criticalAssets, incidents, auditEvents } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/overview", async (req, res) => {
  const allCases = await db.select().from(cases)
    .leftJoin(detections, eq(cases.detectionId, detections.id))
    .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id));
  const allTasks = await db.select().from(tasks);
  const allIncidents = await db.select().from(incidents);
  const allAudit = await db.select().from(auditEvents);

  const casesTotal = allCases.length;
  const needsReview = allCases.filter(c => c.cases.status === "NEEDS_REVIEW" || c.cases.status === "DETECTED").length;
  const confirmed = allCases.filter(c => c.cases.reviewState === "CONFIRMED").length;
  const rejected = allCases.filter(c => c.cases.reviewState === "REJECTED").length;
  const uncertain = allCases.filter(c => c.cases.reviewState === "UNCERTAIN").length;
  const casesClosed = allCases.filter(c => c.cases.status === "CLOSED").length;
  
  const reviewed = confirmed + rejected + uncertain;
  const falsePositiveRate = reviewed > 0 ? Math.round((rejected / reviewed) * 100) : 0;

  const tasksOpen = allTasks.filter(t => t.status !== "COMPLETED" && t.status !== "VERIFIED" && t.status !== "CLOSED").length;
  const tasksCompleted = allTasks.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED" || t.status === "CLOSED").length;
  const tasksOverdue = allTasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== "COMPLETED" && t.status !== "VERIFIED" && t.status !== "CLOSED").length;
  const fieldVerified = allCases.filter(c => c.cases.status === "FIELD_VERIFIED" || c.cases.status === "ACTIONED" || c.cases.status === "CLOSED").length;

  const resolvedTasks = allTasks.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED" || t.status === "CLOSED");
  const onTimeTasks = resolvedTasks.filter(t => !t.dueAt || (t.completedAt && t.completedAt <= t.dueAt));
  const slaCompliance = resolvedTasks.length > 0 ? Math.round((onTimeTasks.length / resolvedTasks.length) * 100) : 100;

  const scatter = allCases.map(c => ({
    caseId: c.cases.id,
    confidence: c.detections?.confidence || 0,
    priority: c.cases.priorityScore || 0,
    criticality: c.critical_assets?.criticalityScore || 0,
    status: c.cases.status
  }));

  const funnel = {
    detected: casesTotal,
    verified: fieldVerified,
    actioned: allCases.filter(c => c.cases.status === "ACTIONED" || c.cases.status === "CLOSED").length,
    closed: casesClosed
  };

  // Time calculations
  let timeToAssess = [];
  for (const c of allCases) {
    const inc = allIncidents.find(i => i.id === c.cases.incidentId);
    if (inc) {
      timeToAssess.push(new Date(c.cases.createdAt).getTime() - new Date(inc.createdAt).getTime());
    }
  }

  let timeToVerify = [];
  for (const c of allCases) {
    if (c.cases.reviewState !== "PENDING") {
      const reviewEvent = allAudit.find(a => a.entityId === c.cases.id && (a.action.includes("CONFIRMED") || a.action.includes("REJECTED") || a.action.includes("UNCERTAIN")));
      if (reviewEvent) {
        timeToVerify.push(new Date(reviewEvent.timestamp).getTime() - new Date(c.cases.createdAt).getTime());
      }
    }
  }

  let timeToTask = [];
  for (const t of allTasks) {
    const c = allCases.find(ca => ca.cases.id === t.caseId);
    if (c && c.cases.reviewState === "CONFIRMED") {
      const reviewEvent = allAudit.find(a => a.entityId === c.cases.id && a.action.includes("CONFIRMED"));
      if (reviewEvent) {
        timeToTask.push(new Date(t.createdAt).getTime() - new Date(reviewEvent.timestamp).getTime());
      }
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length / 60000) : null;

  res.json({
    casesTotal, needsReview, confirmed, rejected, uncertain, falsePositiveRate,
    averageTimeToAssess: avg(timeToAssess),
    averageTimeToVerify: avg(timeToVerify),
    averageTimeToTask: avg(timeToTask),
    slaCompliance, tasksOpen, tasksOverdue, tasksCompleted, fieldVerified, casesClosed,
    scatter, funnel
  });
});

export default router;
