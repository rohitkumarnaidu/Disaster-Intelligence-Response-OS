import { Router } from "express";
import { db, cases, detections, criticalAssets, imageryAssets, caseStatusHistory, auditEvents } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";
import { calculatePriority } from "../lib/priority";
import { transitionCase } from "../services/case-state-machine";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const allCases = await db.select().from(cases)
    .leftJoin(detections, eq(cases.detectionId, detections.id))
    .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
    .orderBy(desc(cases.priorityScore));

  const result = allCases.map((c) => ({
    id: c.cases.id,
    incidentId: c.cases.incidentId,
    title: `${c.detections?.class || 'Unknown'} near ${c.critical_assets?.name || 'Asset'}`,
    assetName: c.critical_assets?.name,
    assetType: c.critical_assets?.type,
    severity: c.detections?.severity,
    confidence: c.detections?.confidence,
    priorityScore: c.cases.priorityScore,
    reviewState: c.cases.reviewState,
    status: c.cases.status,
    owner: c.cases.owner,
    createdAt: c.cases.createdAt,
    version: c.cases.version,
    factors: c.cases.priorityBreakdown,
  }));
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const [c] = await db.select().from(cases)
    .leftJoin(detections, eq(cases.detectionId, detections.id))
    .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
    .where(eq(cases.id, req.params.id as string));

  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Case not found" } });

  const imageryResult = c.detections?.imageryId ? await db.select().from(imageryAssets).where(eq(imageryAssets.id, c.detections.imageryId)) : [];
  
  res.json({
    id: c.cases.id,
    incidentId: c.cases.incidentId,
    title: `${c.detections?.class || 'Unknown'} near ${c.critical_assets?.name || 'Asset'}`,
    assetName: c.critical_assets?.name,
    assetType: c.critical_assets?.type,
    severity: c.detections?.severity,
    confidence: c.detections?.confidence,
    priorityScore: c.cases.priorityScore,
    reviewState: c.cases.reviewState,
    status: c.cases.status,
    owner: c.cases.owner,
    createdAt: c.cases.createdAt,
    version: c.cases.version,
    factors: c.cases.priorityBreakdown,
    inferenceBadge: "Change detected",
    imagery: {
      before: "2025-02-08",
      after: imageryResult[0]?.acquisitionTime?.toISOString()?.split('T')[0] || "2025-02-16"
    }
  });
});

router.post("/:id/review", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"), async (req, res) => {
  const { decision, notes, version } = req.body;
  const caseId = req.params.id as string;

  try {
    const [c] = await db.select().from(cases).leftJoin(detections, eq(cases.detectionId, detections.id)).leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id)).where(eq(cases.id, caseId));
    if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Case not found" } });

    const newStatus = decision === "confirmed" ? "CONFIRMED" : decision === "rejected" ? "REJECTED" : "UNCERTAIN";
    
    let priorityScore = c.cases.priorityScore;
    let priorityBreakdown = c.cases.priorityBreakdown;

    if (decision === "confirmed" && c.detections && c.critical_assets) {
      const p = calculatePriority(c.detections.severity, c.critical_assets.type, c.critical_assets.populationExposureTier, 24, true, c.detections.confidence);
      priorityScore = p.score;
      priorityBreakdown = p.breakdown;
    }

    const updatedCase = await transitionCase(caseId, newStatus, req.session.userId!, version || c.cases.version, notes, {
      reviewState: decision.toUpperCase(),
      priorityScore,
      priorityBreakdown
    });

    res.json({ success: true, newStatus, priorityScore, version: updatedCase.version });
  } catch (error: any) {
    if (error.code === "VERSION_CONFLICT" || error.code === "INVALID_TRANSITION") {
      res.status(409).json({ error });
    } else {
      res.status(500).json({ error: { message: error.message } });
    }
  }
});

router.get("/:id/audit", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander", "Field Responder"), async (req, res) => {
  const caseId = req.params.id as string;
  const { users } = await import("@workspace/db");
  const events = await db.select({
    id: auditEvents.id,
    timestamp: auditEvents.timestamp,
    action: auditEvents.action,
    metadata: auditEvents.metadata,
    actorId: auditEvents.actorId,
    actorName: users.name,
    actorRole: users.role
  }).from(auditEvents)
  .leftJoin(users, eq(auditEvents.actorId, users.id))
  .where(eq(auditEvents.entityId, caseId))
  .orderBy(desc(auditEvents.timestamp));

  res.json(events);
});

export default router;


