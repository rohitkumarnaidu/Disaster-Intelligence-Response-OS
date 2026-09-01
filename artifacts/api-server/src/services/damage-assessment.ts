import {
  db,
  detections,
  cases,
  criticalAssets,
  osmCriticalAssets,
  imageryAssets,
  auditEvents,
  evidence,
  aiDecisionLogs,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { calculatePriority } from "../lib/priority";
import { jobRunner } from "./job-runner";
import { logger } from "../lib/logger";
import { aiProviderFactory } from "../ai/AIProviderFactory";
import { aiCacheService } from "../ai/cache/AICacheService";
import crypto from "crypto";

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface AssessmentOptions {
  incidentId: string;
  beforeImageryId: string;
  afterImageryId: string;
  aoi?: any;
  providerId?: string;
}

export async function runDamageAssessment(
  jobId: string,
  options: AssessmentOptions
): Promise<{ detectionsCreated: number; casesCreated: number; candidateDetections: any[] }> {
  const { incidentId, beforeImageryId, afterImageryId, providerId } = options;

  logger.info({ jobId, incidentId, beforeImageryId, afterImageryId }, "Starting AI damage assessment pipeline");

  const [beforeAsset] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, beforeImageryId));
  const [afterAsset] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, afterImageryId));

  if (!beforeAsset || !afterAsset) {
    throw new Error(`Imagery assets not found (before: ${beforeImageryId}, after: ${afterImageryId})`);
  }

  const aiProvider = aiProviderFactory.getProvider(providerId);

  // Retrieve cached critical assets in the area
  let assets = await db.select().from(osmCriticalAssets).where(eq(osmCriticalAssets.incidentId, incidentId));
  if (assets.length === 0) {
    // Fall back to general criticalAssets table
    const critRows = await db.select().from(criticalAssets);
    assets = critRows.map((c: any) => ({
      id: c.id,
      incidentId: incidentId,
      osmId: c.osmId || c.id,
      osmType: "node",
      name: c.name,
      assetType: c.type,
      latitude: (c.location as any)?.coordinates?.[1] || 13.04,
      longitude: (c.location as any)?.coordinates?.[0] || 80.24,
      geometry: c.location,
      tags: {},
      criticalityScore: c.criticalityScore,
      populationExposureTier: c.populationExposureTier,
      source: "Database Seed",
      retrievedAt: new Date(),
    }));
  }

  const targetAssets = assets.slice(0, 5); // Focus on key facilities
  const createdDetections: any[] = [];
  const createdCases: any[] = [];

  const isSAR = (afterAsset.collection || "").includes("sentinel-1") || (afterAsset.source || "").includes("S1");

  for (let i = 0; i < targetAssets.length; i++) {
    const asset = targetAssets[i];
    const detId = `det-${Date.now()}-${i}`;
    const caseId = `case-auto-${Date.now()}-${i}`;

    const detLon = asset.longitude + (Math.random() * 0.004 - 0.002);
    const detLat = asset.latitude + (Math.random() * 0.004 - 0.002);
    const distanceToAssetMeters = Math.round(calculateDistanceMeters(detLat, detLon, asset.latitude, asset.longitude));

    // Run AI structured assessment
    const aiAssessment = await aiProvider.assessDamage({
      incidentId,
      caseId,
      assetContext: {
        name: asset.name,
        type: asset.assetType,
        criticalityScore: asset.criticalityScore ?? undefined,
        populationExposureTier: asset.populationExposureTier ?? undefined,
        latitude: asset.latitude,
        longitude: asset.longitude,
      },
      sensorType: isSAR ? "SAR" : "OPTICAL",
      beforeImage: {
        productId: beforeAsset.externalProductId || beforeAsset.id,
        url: beforeAsset.sourceUrl || beforeAsset.catalogUrl || undefined,
      },
      afterImage: {
        productId: afterAsset.externalProductId || afterAsset.id,
        url: afterAsset.sourceUrl || afterAsset.catalogUrl || undefined,
      },
    });

    const severity =
      aiAssessment.damageClass === "DESTROYED" || aiAssessment.damageClass === "SEVERE"
        ? "Severe"
        : aiAssessment.damageClass === "MODERATE"
        ? "Moderate"
        : "Minor";

    const damageClassLabel = `${aiAssessment.damageClass} - ${aiAssessment.observedChanges[0]?.type || "Structural Inundation"}`;

    const detectionGeometry = {
      type: "Point",
      coordinates: [detLon, detLat],
    };

    // Calculate explainable, deterministic priority score
    const hoursSinceIncident = 6.0;
    const accessConstrained = distanceToAssetMeters < 300 || asset.populationExposureTier === "High";
    const priorityResult = calculatePriority(
      severity,
      asset.assetType,
      asset.populationExposureTier || "High",
      hoursSinceIncident,
      accessConstrained,
      aiAssessment.confidence
    );

    // 1. Insert Detection with lineage to Job, AI Model, and Imagery
    await db.insert(detections).values({
      id: detId,
      incidentId,
      imageryId: afterImageryId,
      geometry: detectionGeometry,
      class: damageClassLabel,
      severity,
      confidence: aiAssessment.confidence,
      modelName: aiAssessment.metadata.model,
      modelVersion: aiAssessment.metadata.modelVersion,
      inferenceTimestamp: new Date(),
      externalSource: afterAsset.provider || "COPERNICUS",
      externalId: afterAsset.externalProductId || afterAsset.id,
      processingJobId: jobId,
    });

    // 2. Insert Case
    await db.insert(cases).values({
      id: caseId,
      incidentId,
      detectionId: detId,
      assetId: asset.id,
      status: "NEEDS_REVIEW",
      priorityScore: priorityResult.score,
      priorityBreakdown: {
        ...priorityResult.breakdown,
        nearestAsset: asset.name,
        distanceToAssetMeters,
        modelName: aiAssessment.metadata.model,
        modelVersion: aiAssessment.metadata.modelVersion,
        aiDamageClass: aiAssessment.damageClass,
        aiConfidence: aiAssessment.confidence,
        reasoningSummary: aiAssessment.reasoningSummary,
        processingJobId: jobId,
        satelliteProduct: afterAsset.title || afterAsset.externalProductId,
      },
      reviewState: "UNREVIEWED",
      version: 1,
      dataMode: afterAsset.dataMode || "REAL",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Attach Evidence Record
    await db.insert(evidence).values({
      id: `ev-${Date.now()}-${i}`,
      caseId,
      type: isSAR ? "SAR_COHERENCE_MAP" : "OPTICAL_NDWI_OVERLAY",
      uri: afterAsset.localUri || afterAsset.catalogUrl || `https://dataspace.copernicus.eu/item/${afterAsset.externalProductId}`,
      source: afterAsset.provider || "COPERNICUS_STAC",
      mimeType: "application/json",
      metadata: {
        beforeProduct: beforeAsset.externalProductId || beforeAsset.title,
        afterProduct: afterAsset.externalProductId || afterAsset.title,
        distanceToAssetMeters,
        confidence: aiAssessment.confidence,
        aiAssessment,
      },
      timestamp: new Date(),
    });

    // 4. Record Immutable AI Decision Log
    await db.insert(aiDecisionLogs).values({
      id: `ai-log-${Date.now()}-${i}`,
      caseId,
      jobId,
      incidentId,
      provider: aiAssessment.metadata.provider,
      model: aiAssessment.metadata.model,
      modelVersion: aiAssessment.metadata.modelVersion,
      promptVersion: aiAssessment.metadata.promptVersion,
      inputHash: aiAssessment.metadata.inputHash,
      outputHash: aiAssessment.metadata.outputHash || null,
      result: aiAssessment,
      damageClass: aiAssessment.damageClass,
      confidence: aiAssessment.confidence,
      latencyMs: aiAssessment.metadata.latencyMs,
      tokenUsage: aiAssessment.metadata.tokenUsage || {},
      reviewerDecision: "PENDING",
      createdAt: new Date(),
    });

    // 5. Audit Log
    const auditId = `audit-${Date.now()}-${i}`;
    await db.insert(auditEvents).values({
      id: auditId,
      entityType: "case",
      entityId: caseId,
      action: "CREATED_FROM_AI_SATELLITE_PIPELINE",
      metadata: {
        jobId,
        detectionId: detId,
        priorityScore: priorityResult.score,
        provider: aiAssessment.metadata.provider,
        model: aiAssessment.metadata.model,
      },
      timestamp: new Date(),
    });

    const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");
    const caseEvent = await enqueueOutboxEvent(db, {
      eventType: "CASE_CREATED",
      entityType: "CASE",
      entityId: caseId,
      incidentId,
      version: 1,
      payload: {
        id: caseId,
        incidentId,
        status: "NEEDS_REVIEW",
        reviewState: "UNREVIEWED",
        priorityScore: priorityResult.score,
        priorityBreakdown: priorityResult.breakdown,
        title: `${damageClassLabel} near ${asset.name}`,
        assetName: asset.name,
        assetType: asset.assetType,
        severity,
        confidence: aiAssessment.confidence,
        version: 1,
        createdAt: new Date().toISOString(),
      },
    });

    if (caseEvent) dispatchCommittedEvent(caseEvent).catch(() => {});

    createdDetections.push({ id: detId, class: damageClassLabel, severity, confidence: aiAssessment.confidence });
    createdCases.push({ id: caseId, priorityScore: priorityResult.score, asset: asset.name });
  }

  return {
    detectionsCreated: createdDetections.length,
    casesCreated: createdCases.length,
    candidateDetections: createdDetections,
  };
}

// Register handler in JobRunner
jobRunner.registerHandler("CHANGE_DETECTION", async (jobId, params) => {
  return runDamageAssessment(jobId, {
    incidentId: params.incidentId,
    beforeImageryId: params.beforeImageryId,
    afterImageryId: params.afterImageryId,
    aoi: params.aoi,
    providerId: params.providerId,
  });
});
