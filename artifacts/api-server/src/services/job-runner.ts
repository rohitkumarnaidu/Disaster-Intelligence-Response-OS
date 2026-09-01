import { db, processingJobs } from "@workspace/db";
import { eq } from "drizzle-orm";
import { JobType, JobStatus } from "../providers/DataProvider";
import { logger } from "../lib/logger";
import { enqueueOutboxEvent, dispatchCommittedEvent } from "../realtime/outbox";
import { EventType } from "../realtime/contracts";

export interface CreateJobParams {
  incidentId?: string;
  imageryAssetId?: string;
  pairId?: string;
  provider: string;
  jobType: JobType;
  parameters?: Record<string, any>;
}

export type JobHandler = (
  jobId: string,
  params: Record<string, any>,
  signal: AbortSignal
) => Promise<Record<string, any>>;

export class JobRunner {
  private static instance: JobRunner;
  private handlers = new Map<JobType, JobHandler>();
  private activeJobs = new Map<string, AbortController>();

  private constructor() {}

  public static getInstance(): JobRunner {
    if (!JobRunner.instance) {
      JobRunner.instance = new JobRunner();
    }
    return JobRunner.instance;
  }

  public registerHandler(jobType: JobType, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  public async createAndEnqueueJob(params: CreateJobParams): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    let queuedEvent: any = null;

    await db.transaction(async (tx: any) => {
      await tx.insert(processingJobs).values({
        id: jobId,
        incidentId: params.incidentId,
        imageryAssetId: params.imageryAssetId,
        pairId: params.pairId,
        provider: params.provider,
        jobType: params.jobType,
        status: "QUEUED",
        attempts: 0,
        parameters: params.parameters || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      queuedEvent = await enqueueOutboxEvent(tx, {
        eventType: "PROCESSING_JOB_STATUS_CHANGED",
        entityType: "PROCESSING_JOB",
        entityId: jobId,
        incidentId: params.incidentId || null,
        version: 1,
        payload: {
          jobId,
          status: "QUEUED",
          jobType: params.jobType,
          incidentId: params.incidentId,
          provider: params.provider,
          createdAt: new Date().toISOString(),
        },
      });
    });

    if (queuedEvent) dispatchCommittedEvent(queuedEvent).catch(() => {});

    // Run execution asynchronously
    setImmediate(() => {
      this.executeJob(jobId).catch((err) => {
        logger.error({ err, jobId }, "Unexpected error in job execution loop");
      });
    });

    return jobId;
  }

  public async executeJob(jobId: string, maxRetries = 2): Promise<void> {
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId));
    if (!job) return;

    const handler = this.handlers.get(job.jobType as JobType);
    if (!handler) {
      let failedEvent: any = null;
      await db.transaction(async (tx: any) => {
        await tx
          .update(processingJobs)
          .set({
            status: "FAILED",
            errorCode: "NO_HANDLER",
            errorMessage: `No handler registered for job type ${job.jobType}`,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(processingJobs.id, jobId));

        failedEvent = await enqueueOutboxEvent(tx, {
          eventType: "AI_JOB_FAILED",
          entityType: "PROCESSING_JOB",
          entityId: jobId,
          incidentId: job.incidentId,
          version: 1,
          payload: {
            jobId,
            status: "FAILED",
            jobType: job.jobType,
            incidentId: job.incidentId,
            error: `No handler registered for job type ${job.jobType}`,
          },
        });
      });
      if (failedEvent) dispatchCommittedEvent(failedEvent).catch(() => {});
      return;
    }

    const abortController = new AbortController();
    this.activeJobs.set(jobId, abortController);

    let startedEvent: any = null;
    await db.transaction(async (tx: any) => {
      await tx
        .update(processingJobs)
        .set({
          status: "RUNNING",
          startedAt: new Date(),
          attempts: (job.attempts || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(processingJobs.id, jobId));

      startedEvent = await enqueueOutboxEvent(tx, {
        eventType: "AI_JOB_STARTED",
        entityType: "PROCESSING_JOB",
        entityId: jobId,
        incidentId: job.incidentId,
        version: 1,
        payload: {
          jobId,
          status: "RUNNING",
          jobType: job.jobType,
          incidentId: job.incidentId,
          startedAt: new Date().toISOString(),
        },
      });
    });

    if (startedEvent) dispatchCommittedEvent(startedEvent).catch(() => {});

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const result = await handler(jobId, (job.parameters as any) || {}, abortController.signal);

        let successEvent: any = null;
        await db.transaction(async (tx: any) => {
          await tx
            .update(processingJobs)
            .set({
              status: "SUCCEEDED",
              resultMetadata: result,
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(processingJobs.id, jobId));

          successEvent = await enqueueOutboxEvent(tx, {
            eventType: "AI_JOB_COMPLETED",
            entityType: "PROCESSING_JOB",
            entityId: jobId,
            incidentId: job.incidentId,
            version: 1,
            payload: {
              jobId,
              status: "SUCCEEDED",
              jobType: job.jobType,
              incidentId: job.incidentId,
              result,
              completedAt: new Date().toISOString(),
            },
          });
        });

        if (successEvent) dispatchCommittedEvent(successEvent).catch(() => {});
        break;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries || abortController.signal.aborted) {
          logger.error({ err, jobId, attempt }, "Job execution failed permanently");

          let failureEvent: any = null;
          await db.transaction(async (tx: any) => {
            await tx
              .update(processingJobs)
              .set({
                status: "FAILED",
                errorCode: err.code || "JOB_EXECUTION_ERROR",
                errorMessage: err.message || "Execution error",
                completedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(processingJobs.id, jobId));

            failureEvent = await enqueueOutboxEvent(tx, {
              eventType: "AI_JOB_FAILED",
              entityType: "PROCESSING_JOB",
              entityId: jobId,
              incidentId: job.incidentId,
              version: 1,
              payload: {
                jobId,
                status: "FAILED",
                jobType: job.jobType,
                incidentId: job.incidentId,
                error: err.message,
                completedAt: new Date().toISOString(),
              },
            });
          });

          if (failureEvent) dispatchCommittedEvent(failureEvent).catch(() => {});
          break;
        }

        // Exponential backoff with jitter
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 10000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }


    this.activeJobs.delete(jobId);
  }

  public async getJob(jobId: string) {
    const [job] = await db.select().from(processingJobs).where(eq(processingJobs.id, jobId));
    return job;
  }

  public async getJobStatus(jobId: string) {
    return this.getJob(jobId);
  }

  public cancelJob(jobId: string): boolean {
    const controller = this.activeJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(jobId);
      db.update(processingJobs)
        .set({ status: "CANCELLED", completedAt: new Date(), updatedAt: new Date() })
        .where(eq(processingJobs.id, jobId))
        .catch(() => {});
      return true;
    }
    return false;
  }
}

export const jobRunner = JobRunner.getInstance();
