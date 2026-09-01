import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { jobRunner } from "../services/job-runner";
import { db, processingJobs } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import "../services/damage-assessment"; // Ensure handlers are registered

const router = Router();
router.use(requireAuth);

/**
 * POST /api/processing/jobs
 * Launch asynchronous processing job
 */
router.post("/jobs", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"), async (req, res) => {
  try {
    const { incidentId, imageryAssetId, pairId, provider = "COPERNICUS", jobType = "CHANGE_DETECTION", parameters = {} } = req.body;

    if (!jobType) {
      return res.status(400).json({ error: { message: "jobType is required" } });
    }

    const jobId = await jobRunner.createAndEnqueueJob({
      incidentId,
      imageryAssetId,
      pairId,
      provider,
      jobType,
      parameters,
    });

    res.status(202).json({
      jobId,
      status: "QUEUED",
      message: `Job ${jobId} of type ${jobType} enqueued successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/processing/jobs
 * List jobs
 */
router.get("/jobs", async (req, res) => {
  try {
    const { incidentId } = req.query;
    if (incidentId) {
      const jobs = await db
        .select()
        .from(processingJobs)
        .where(eq(processingJobs.incidentId, String(incidentId)))
        .orderBy(desc(processingJobs.createdAt))
        .limit(30);
      return res.json(jobs);
    }

    const jobs = await db.select().from(processingJobs).orderBy(desc(processingJobs.createdAt)).limit(50);
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/processing/jobs/:id
 * Get single job status
 */
router.get("/jobs/:id", async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId));
    if (!job) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Job not found" } });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/processing/jobs/:id/cancel
 * Cancel running job
 */
router.post("/jobs/:id/cancel", requireRole("System Admin", "Organization Admin", "Disaster Officer"), async (req, res) => {
  try {
    const jobId = req.params.id as string;
    const cancelled = jobRunner.cancelJob(jobId);
    res.json({ success: cancelled });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
