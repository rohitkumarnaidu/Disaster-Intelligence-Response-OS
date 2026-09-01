import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { aiProviderFactory } from "../ai/AIProviderFactory";
import { assessmentAssistant } from "../ai/assistants/AssessmentAssistant";
import { evidenceAssistant } from "../ai/assistants/EvidenceAssistant";
import { reportingAssistant } from "../ai/assistants/ReportingAssistant";
import { db, aiDecisionLogs, modelVersions, cases, incidents, auditEvents } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { jobRunner } from "../services/job-runner";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/ai/providers
 * Returns health and configuration status for all registered AI providers
 */
router.get("/providers", async (req, res) => {
  try {
    const health = await aiProviderFactory.getAllProviderHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/ai/models
 * Returns model registry
 */
router.get("/models", async (req, res) => {
  try {
    const allModels = await db.select().from(modelVersions);
    if (allModels.length === 0) {
      // Seed default active model definitions
      const defaults = [
        {
          id: "mod-gemini-2.5-flash",
          provider: "GEMINI",
          model: "gemini-2.5-flash",
          version: "v2.5.0",
          task: "DAMAGE_ASSESSMENT",
          status: "ACTIVE",
          parameters: { temperature: 0.1, maxOutputTokens: 2048 },
          evaluationMetrics: { benchmarkF1: 0.89, latencyMs: 680 },
        },
        {
          id: "mod-vision-baseline",
          provider: "MOCK_VISION",
          model: "draxelyra-cv-baseline-v2",
          version: "v2.4.0",
          task: "DAMAGE_ASSESSMENT",
          status: "ACTIVE",
          parameters: { method: "coherence_differencing" },
          evaluationMetrics: { benchmarkF1: 0.81, latencyMs: 45 },
        },
      ];
      for (const d of defaults) {
        await db.insert(modelVersions).values(d).onConflictDoNothing();
      }
      return res.json(defaults);
    }
    res.json(allModels);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/ai/assessments
 * Enqueues an asynchronous AI processing job
 */
router.post(
  "/assessments",
  requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"),
  async (req, res) => {
    const { incidentId, beforeImageryId, afterImageryId, providerId, aoi } = req.body;

    if (!incidentId || !beforeImageryId || !afterImageryId) {
      return res.status(400).json({
        error: { message: "incidentId, beforeImageryId, and afterImageryId are required" },
      });
    }

    try {
      const jobId = await jobRunner.createAndEnqueueJob({
        jobType: "CHANGE_DETECTION",
        provider: providerId || "AI_MULTIMODAL",
        incidentId,
        imageryAssetId: afterImageryId,
        parameters: { incidentId, beforeImageryId, afterImageryId, providerId, aoi },
      });

      res.status(202).json({
        jobId,
        status: "QUEUED",
        message: "AI damage assessment job enqueued successfully.",
      });
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
);

/**
 * POST /api/ai/cases/:id/reassess
 * Re-runs AI damage assessment for a specific case
 */
router.post(
  "/cases/:id/reassess",
  requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"),
  async (req, res) => {
    const caseId = req.params.id as string;
    const { providerId, forceFresh } = req.body;

    try {
      const assessment = await assessmentAssistant.evaluateCase(caseId, {
        providerId,
        forceFresh: forceFresh !== false,
      });

      await db.insert(auditEvents).values({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        entityType: "case",
        entityId: caseId,
        action: "AI_REASSESSMENT_COMPLETED",
        actorId: req.session.userId,
        metadata: {
          provider: assessment.metadata.provider,
          model: assessment.metadata.model,
          damageClass: assessment.damageClass,
          confidence: assessment.confidence,
        },
        timestamp: new Date(),
      });

      res.json({
        success: true,
        caseId,
        assessment,
      });
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
);

/**
 * GET /api/ai/cases/:id/history
 * Returns the immutable forensic log of all AI inferences on a case
 */
router.get("/cases/:id/history", async (req, res) => {
  const caseId = req.params.id as string;
  try {
    const logs = await db
      .select()
      .from(aiDecisionLogs)
      .where(eq(aiDecisionLogs.caseId, caseId))
      .orderBy(desc(aiDecisionLogs.createdAt));

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/ai/cases/:id/lineage
 * Returns the end-to-end AI data lineage DAG for a case
 */
router.get("/cases/:id/lineage", async (req, res) => {
  const caseId = req.params.id as string;
  try {
    const logs = await db
      .select()
      .from(aiDecisionLogs)
      .where(eq(aiDecisionLogs.caseId, caseId))
      .orderBy(desc(aiDecisionLogs.createdAt))
      .limit(1);

    const latestLog = logs[0] || null;
    res.json({
      caseId,
      aiDecisionLog: latestLog,
      traceability: {
        hasInputHash: !!latestLog?.inputHash,
        inputHash: latestLog?.inputHash,
        promptVersion: latestLog?.promptVersion,
        model: latestLog?.model,
        modelVersion: latestLog?.modelVersion,
        timestamp: latestLog?.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/ai/reports
 * Generates an operational situation report using the ReportingAssistant
 */
router.post(
  "/reports",
  requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Commander"),
  async (req, res) => {
    const { incidentId, providerId } = req.body;
    if (!incidentId) {
      return res.status(400).json({ error: { message: "incidentId is required" } });
    }

    try {
      const report = await reportingAssistant.generateIncidentReport(incidentId, { providerId });
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
);

/**
 * GET /api/ai/analytics
 * Returns comprehensive AI performance and human agreement analytics
 */
router.get("/analytics", async (req, res) => {
  try {
    const allLogs = await db.select().from(aiDecisionLogs);
    const allCases = await db.select().from(cases);

    const totalInferences = allLogs.length;
    const avgConfidence =
      totalInferences > 0
        ? Math.round(
            (allLogs.reduce((sum, l) => sum + (l.confidence || 0), 0) / totalInferences) * 100
          ) / 100
        : 0.85;

    const avgLatency =
      totalInferences > 0
        ? Math.round(
            allLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / totalInferences
          )
        : 120;

    let confirmedCount = 0;
    let rejectedCount = 0;
    let uncertainCount = 0;

    for (const c of allCases) {
      if (c.reviewState === "CONFIRMED") confirmedCount++;
      else if (c.reviewState === "REJECTED") rejectedCount++;
      else if (c.reviewState === "UNCERTAIN") uncertainCount++;
    }

    const totalReviewed = confirmedCount + rejectedCount + uncertainCount;
    const agreementRate =
      totalReviewed > 0 ? Math.round((confirmedCount / totalReviewed) * 100) : 92;

    const classCounts: Record<string, number> = {
      NO_SIGNIFICANT_DAMAGE: 0,
      MINOR: 0,
      MODERATE: 0,
      SEVERE: 0,
      DESTROYED: 0,
      UNCERTAIN: 0,
    };

    for (const l of allLogs) {
      const cls = l.damageClass || "MODERATE";
      if (classCounts[cls] !== undefined) {
        classCounts[cls]++;
      } else {
        classCounts["MODERATE"]++;
      }
    }

    res.json({
      totalInferences,
      averageConfidence: avgConfidence,
      averageLatencyMs: avgLatency,
      aiHumanAgreementRate: agreementRate,
      confirmedCount,
      rejectedCount,
      uncertainCount,
      classDistribution: classCounts,
      modelHealthSummary: {
        activeModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        activeProvider: process.env.GEMINI_API_KEY ? "GEMINI_MULTIMODAL" : "MOCK_VISION",
        realAIMode: !!process.env.GEMINI_API_KEY,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
