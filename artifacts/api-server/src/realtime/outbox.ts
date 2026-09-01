import { db, pool, outboxEvents } from "@workspace/db";
import { eq, and, isNull, sql, desc, gte } from "drizzle-orm";
import crypto from "crypto";
import { DomainEvent, EntityType, EventType } from "./contracts";
import { logger } from "../lib/logger";
import { realtimeGateway } from "./gateway";

export interface CreateEventParams<T = any> {
  eventType: EventType;
  entityType: EntityType;
  entityId: string;
  incidentId?: string | null;
  organizationId?: string | null;
  version: number;
  actorId?: string | null;
  correlationId?: string | null;
  payload: T;
}

/**
 * Transactional helper: Enqueues an outbox event within the SAME database transaction.
 */
export async function enqueueOutboxEvent<T = any>(
  tx: any,
  params: CreateEventParams<T>
): Promise<DomainEvent<T>> {
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const occurredAt = new Date();

  await tx.insert(outboxEvents).values({
    id: eventId,
    eventType: params.eventType,
    entityType: params.entityType,
    entityId: params.entityId,
    incidentId: params.incidentId || null,
    organizationId: params.organizationId || null,
    version: params.version,
    payload: params.payload,
    actorId: params.actorId || null,
    correlationId: params.correlationId || null,
    occurredAt,
    publishedAt: null,
    attempts: 0,
    lastError: null,
  });

  const domainEvent: DomainEvent<T> = {
    id: eventId,
    type: params.eventType,
    entityType: params.entityType,
    entityId: params.entityId,
    incidentId: params.incidentId || null,
    organizationId: params.organizationId || null,
    version: params.version,
    occurredAt: occurredAt.toISOString(),
    actorId: params.actorId || null,
    correlationId: params.correlationId || null,
    data: params.payload,
  };

  return domainEvent;
}

/**
 * Post-Commit Immediate Dispatch:
 * Publishes the committed event to connected clients immediately and marks it published in DB.
 */
export async function dispatchCommittedEvent(event: DomainEvent): Promise<void> {
  try {
    // 1. Broadcast to real-time gateway subscribers
    realtimeGateway.broadcastEvent(event);

    // 2. Mark as published in outbox_events
    await db
      .update(outboxEvents)
      .set({ publishedAt: new Date() })
      .where(eq(outboxEvents.id, event.id));
  } catch (err: any) {
    logger.error({ err, eventId: event.id }, "Error during immediate event dispatch; outbox worker will retry");
    try {
      await db
        .update(outboxEvents)
        .set({ attempts: sql`attempts + 1`, lastError: err.message })
        .where(eq(outboxEvents.id, event.id));
    } catch {}
  }
}

/**
 * Outbox Processor & Background Worker
 * Guarantees delivery even if immediate dispatch crashed or failed.
 */
export class OutboxProcessor {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  public start(intervalMs = 3000): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.processPendingEvents(), intervalMs);
    logger.info({ intervalMs }, "Outbox processor background worker started");
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async processPendingEvents(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;
    let publishedCount = 0;

    try {
      // Find unpublished events with attempts < 5
      const pending = await db
        .select()
        .from(outboxEvents)
        .where(and(isNull(outboxEvents.publishedAt), sql`attempts < 5`))
        .orderBy(outboxEvents.occurredAt)
        .limit(50);

      for (const row of pending) {
        const domainEvent: DomainEvent = {
          id: row.id,
          type: row.eventType as EventType,
          entityType: row.entityType as EntityType,
          entityId: row.entityId,
          incidentId: row.incidentId,
          organizationId: row.organizationId,
          version: row.version,
          occurredAt: row.occurredAt.toISOString(),
          actorId: row.actorId,
          correlationId: row.correlationId,
          data: row.payload,
        };

        try {
          realtimeGateway.broadcastEvent(domainEvent);
          await db
            .update(outboxEvents)
            .set({ publishedAt: new Date() })
            .where(eq(outboxEvents.id, row.id));
          publishedCount++;
        } catch (err: any) {
          await db
            .update(outboxEvents)
            .set({
              attempts: (row.attempts || 0) + 1,
              lastError: err.message,
            })
            .where(eq(outboxEvents.id, row.id));
        }
      }
    } catch (err: any) {
      logger.error({ err }, "Error processing outbox events");
    } finally {
      this.isProcessing = false;
    }

    return publishedCount;
  }

  /**
   * Replay historical events for a client reconnecting after network loss
   */
  public async getEventsSince(
    since: Date,
    options?: { incidentId?: string; entityType?: EntityType; limit?: number }
  ): Promise<DomainEvent[]> {
    const limit = options?.limit || 100;
    const conditions = [gte(outboxEvents.occurredAt, since)];

    if (options?.incidentId) {
      conditions.push(eq(outboxEvents.incidentId, options.incidentId));
    }
    if (options?.entityType) {
      conditions.push(eq(outboxEvents.entityType, options.entityType));
    }

    const rows = await db
      .select()
      .from(outboxEvents)
      .where(and(...conditions))
      .orderBy(outboxEvents.occurredAt)
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      type: r.eventType as EventType,
      entityType: r.entityType as EntityType,
      entityId: r.entityId,
      incidentId: r.incidentId,
      organizationId: r.organizationId,
      version: r.version,
      occurredAt: r.occurredAt.toISOString(),
      actorId: r.actorId,
      correlationId: r.correlationId,
      data: r.payload,
    }));
  }

  /**
   * Prunes published outbox events older than 7 days (Audit events remain preserved in audit_events table).
   */
  public async pruneOldEvents(retentionDays = 7): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 3600 * 1000);
      const res = await db
        .delete(outboxEvents)
        .where(and(sql`published_at IS NOT NULL`, sql`published_at < ${cutoff}`));
      return (res as any)?.rowCount || 0;
    } catch (err) {
      logger.error({ err }, "Failed to prune old outbox events");
      return 0;
    }
  }
}

export const outboxProcessor = new OutboxProcessor();
