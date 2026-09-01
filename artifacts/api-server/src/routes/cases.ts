import { Router } from "express";
import { db, cases, detections, criticalAssets, imageryAssets, caseStatusHistory, auditEvents, incidents, processingJobs, evidence } from "@workspace/db";
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
  
  const afterDateStr = imageryResult[0]?.acquisitionTime?.toISOString()?.split('T')[0] || null;
  let beforeDateStr: string | null = null;
  if (imageryResult[0]?.acquisitionTime) {
    const d = new Date(imageryResult[0].acquisitionTime);
    d.setDate(d.getDate() - 8);
    beforeDateStr = d.toISOString().split('T')[0];
  }

  // Derive inference badge from detection confidence
  const confidence = c.detections?.confidence || 0;
  const inferenceBadge = confidence >= 0.8 ? "High confidence change" :
                         confidence >= 0.5 ? "Change detected" :
                         confidence >= 0.3 ? "Possible change" : "Low confidence";

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
    inferenceBadge,
    imagery: {
      before: beforeDateStr,
      after: afterDateStr
    }
  });
});

/**
 * GET /api/cases/:id/lineage
 * Returns the end-to-end data provenance and lineage graph
 */
router.get("/:id/lineage", async (req, res) => {
  const caseId = req.params.id as string;
  const [c] = await db.select().from(cases)
    .leftJoin(detections, eq(cases.detectionId, detections.id))
    .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
    .where(eq(cases.id, caseId));

  if (!c) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Case not found" } });

  const [incident] = await db.select().from(incidents).where(eq(incidents.id, c.cases.incidentId));
  
  let imageryAsset: any = null;
  if (c.detections?.imageryId) {
    const [img] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, c.detections.imageryId));
    imageryAsset = img;
  }

  let processingJob: any = null;
  if (c.detections?.processingJobId) {
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, c.detections.processingJobId));
    processingJob = job;
  }

  const caseEvidence = await db.select().from(evidence).where(eq(evidence.caseId, caseId));
  const caseAudit = await db.select().from(auditEvents).where(eq(auditEvents.entityId, caseId)).orderBy(desc(auditEvents.timestamp));

  res.json({
    case: {
      id: c.cases.id,
      status: c.cases.status,
      priorityScore: c.cases.priorityScore,
      reviewState: c.cases.reviewState,
      dataMode: c.cases.dataMode || "REAL",
      createdAt: c.cases.createdAt,
    },
    incident: incident ? {
      id: incident.id,
      name: incident.name,
      disasterType: incident.disasterType,
      aoi: incident.aoi,
    } : null,
    detection: c.detections ? {
      id: c.detections.id,
      class: c.detections.class,
      severity: c.detections.severity,
      confidence: c.detections.confidence,
      modelName: c.detections.modelName,
      modelVersion: c.detections.modelVersion,
      inferenceTimestamp: c.detections.inferenceTimestamp,
      geometry: c.detections.geometry,
    } : null,
    criticalAsset: c.critical_assets ? {
      id: c.critical_assets.id,
      name: c.critical_assets.name,
      type: c.critical_assets.type,
      osmId: c.critical_assets.osmId,
      criticalityScore: c.critical_assets.criticalityScore,
      populationExposureTier: c.critical_assets.populationExposureTier,
    } : null,
    processingJob: processingJob ? {
      id: processingJob.id,
      jobType: processingJob.jobType,
      status: processingJob.status,
      startedAt: processingJob.startedAt,
      completedAt: processingJob.completedAt,
      resultMetadata: processingJob.resultMetadata,
    } : null,
    imageryAsset: imageryAsset ? {
      id: imageryAsset.id,
      externalProductId: imageryAsset.externalProductId,
      provider: imageryAsset.provider,
      collection: imageryAsset.collection,
      title: imageryAsset.title,
      acquisitionTime: imageryAsset.acquisitionTime,
      sourceUrl: imageryAsset.sourceUrl,
      catalogUrl: imageryAsset.catalogUrl,
      qualityStatus: imageryAsset.qualityStatus,
      processingLevel: imageryAsset.processingLevel,
      cloudCover: imageryAsset.cloudCover,
    } : null,
    evidence: caseEvidence,
    auditTrail: caseAudit,
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
      const incidentRows = await db.select().from(incidents).where(eq(incidents.id, c.cases.incidentId)).limit(1);
      const incidentCreatedAt = incidentRows[0]?.createdAt || c.cases.createdAt;
      const hoursSinceIncident = Math.max(0, (Date.now() - new Date(incidentCreatedAt).getTime()) / (1000 * 60 * 60));
      const accessConstrained = c.critical_assets.populationExposureTier === "High";
      const p = calculatePriority(c.detections.severity, c.critical_assets.type, c.critical_assets.populationExposureTier, hoursSinceIncident, accessConstrained, c.detections.confidence);
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
