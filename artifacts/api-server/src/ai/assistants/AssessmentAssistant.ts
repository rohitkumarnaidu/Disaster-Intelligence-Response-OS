import { AIProvider, AssessmentInput, StructuredDamageAssessment } from "../AIProvider";
import { aiProviderFactory } from "../AIProviderFactory";
import { aiCacheService } from "../cache/AICacheService";
import { db, aiDecisionLogs, cases, detections, criticalAssets, imageryAssets } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../../lib/logger";

export class AssessmentAssistant {
  private provider: AIProvider;

  constructor(providerId?: string) {
    this.provider = aiProviderFactory.getProvider(providerId);
  }

  public async evaluateCase(
    caseId: string,
    options: {
      providerId?: string;
      jobId?: string;
      forceFresh?: boolean;
    } = {}
  ): Promise<StructuredDamageAssessment> {
    const provider = options.providerId
      ? aiProviderFactory.getProvider(options.providerId)
      : this.provider;

    const [c] = await db
      .select()
      .from(cases)
      .leftJoin(detections, eq(cases.detectionId, detections.id))
      .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
      .where(eq(cases.id, caseId));

    if (!c) {
      throw new Error(`Case ${caseId} not found`);
    }

    let beforeImage: any = null;
    let afterImage: any = null;

    if (c.detections?.imageryId) {
      const [img] = await db
        .select()
        .from(imageryAssets)
        .where(eq(imageryAssets.id, c.detections.imageryId));

      if (img) {
        afterImage = {
          url: img.sourceUrl || img.catalogUrl,
          productId: img.externalProductId || img.id,
          mimeType: "image/jpeg",
          description: img.title || "Post-event satellite pass",
        };
      }
    }

    const input: AssessmentInput = {
      incidentId: c.cases.incidentId,
      caseId: c.cases.id,
      assetContext: c.critical_assets
        ? {
            name: c.critical_assets.name,
            type: c.critical_assets.type,
            criticalityScore: c.critical_assets.criticalityScore || 50,
            populationExposureTier: c.critical_assets.populationExposureTier || "Medium",
          }
        : undefined,
      afterImage,
      sensorType: c.detections?.class.includes("SAR") ? "SAR" : "OPTICAL",
      metadata: {
        caseStatus: c.cases.status,
        detectionClass: c.detections?.class,
        severity: c.detections?.severity,
      },
    };

    const inputString = JSON.stringify(input);
    const inputHash = crypto.createHash("sha256").update(inputString).digest("hex");

    // Check cache unless forceFresh is requested
    if (!options.forceFresh) {
      const cached = await aiCacheService.getCached(
        inputHash,
        provider.defaultModel,
        "damage_assessment_v1.0",
        "zod_v1"
      );
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
          },
        };
      }
    }

    logger.info({ caseId, provider: provider.id }, "Running AI damage assessment");
    const assessment = await provider.assessDamage(input);

    // Save to Cache
    await aiCacheService.setCached({
      inputHash,
      provider: provider.id,
      model: assessment.metadata.model,
      promptVersion: assessment.metadata.promptVersion,
      schemaVersion: assessment.metadata.schemaVersion,
      responsePayload: assessment,
      tokenUsage: assessment.metadata.tokenUsage,
      latencyMs: assessment.metadata.latencyMs,
    });

    // Write to immutable forensic AI Decision Log
    await db.insert(aiDecisionLogs).values({
      id: `ai-log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      caseId: c.cases.id,
      jobId: options.jobId || null,
      incidentId: c.cases.incidentId,
      provider: provider.id,
      model: assessment.metadata.model,
      modelVersion: assessment.metadata.modelVersion,
      promptVersion: assessment.metadata.promptVersion,
      inputHash,
      outputHash: assessment.metadata.outputHash || null,
      result: assessment,
      damageClass: assessment.damageClass,
      confidence: assessment.confidence,
      latencyMs: assessment.metadata.latencyMs,
      tokenUsage: assessment.metadata.tokenUsage || {},
      reviewerDecision: c.cases.reviewState || "PENDING",
      createdAt: new Date(),
    });

    return assessment;
  }
}

export const assessmentAssistant = new AssessmentAssistant();
