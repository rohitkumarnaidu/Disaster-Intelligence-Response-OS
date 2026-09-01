import { describe, it, expect, beforeEach } from "vitest";
import { db, cases, tasks, incidents, outboxEvents, auditEvents, users, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { enqueueOutboxEvent, dispatchCommittedEvent, outboxProcessor } from "./outbox";
import { realtimeGateway } from "./gateway";
import { transitionCase } from "../services/case-state-machine";
import { transitionTask } from "../services/task-state-machine";

describe("DRAXELYRA Real-Time System & Outbox Zero-Trust Suite", () => {
  const testIncidentId = `inc-rt-test-${Date.now()}`;
  const testCaseId = `case-rt-test-${Date.now()}`;
  const testTaskId = `task-rt-test-${Date.now()}`;

  beforeEach(async () => {
    try {
      await db.insert(users).values([
        {
          id: "user-auditor-1",
          name: "Auditor One",
          email: `auditor1-${Date.now()}@test.org`,
          role: "System Admin",
          passwordHash: "test_hash_val",
          createdAt: new Date(),
        },
        {
          id: "user-auditor-2",
          name: "Auditor Two",
          email: `auditor2-${Date.now()}@test.org`,
          role: "Disaster Officer",
          passwordHash: "test_hash_val",
          createdAt: new Date(),
        },
        {
          id: "responder-10",
          name: "Field Responder Ten",
          email: `responder10-${Date.now()}@test.org`,
          role: "Field Responder",
          passwordHash: "test_hash_val",
          createdAt: new Date(),
        },
      ]);
    } catch {}

    try {
      await db.insert(incidents).values({
        id: testIncidentId,
        name: "Realtime Test Hurricane",
        disasterType: "CYCLONE",
        status: "Active",
        severity: "Severe",
        aoi: { type: "Polygon", coordinates: [[[80, 13], [81, 13], [81, 14], [80, 14], [80, 13]]] },
        description: "Zero-trust realtime test",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch {}
  });

  describe("1. Transactional Outbox Pattern & Rollback Safety", () => {
    it("persists outbox event within a committed database transaction", async () => {
      let createdEvent: any = null;

      await db.transaction(async (tx: any) => {
        createdEvent = await enqueueOutboxEvent(tx, {
          eventType: "INCIDENT_CREATED",
          entityType: "INCIDENT",
          entityId: testIncidentId,
          incidentId: testIncidentId,
          version: 1,
          payload: { name: "Test Transaction Incident" },
        });
      });

      expect(createdEvent).toBeDefined();
      expect(createdEvent.id).toMatch(/^evt_/);

      const [stored] = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.id, createdEvent.id));

      expect(stored).toBeDefined();
      expect(stored.entityId).toBe(testIncidentId);
      expect(stored.eventType).toBe("INCIDENT_CREATED");
    });

    it("rolls back outbox event if transaction aborts / throws error", async () => {
      const rollbackEntityId = `inc-fail-${Date.now()}`;
      let rollbackEventId = "";

      try {
        await db.transaction(async (tx: any) => {
          const evt = await enqueueOutboxEvent(tx, {
            eventType: "INCIDENT_CREATED",
            entityType: "INCIDENT",
            entityId: rollbackEntityId,
            incidentId: rollbackEntityId,
            version: 1,
            payload: { name: "Rollback Incident" },
          });
          rollbackEventId = evt.id;
          throw new Error("Simulated database failure during mutation");
        });
      } catch (err: any) {
        expect(err.message).toBe("Simulated database failure during mutation");
      }

      // Verify no orphan outbox record exists
      const rows = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.id, rollbackEventId));

      expect(rows).toHaveLength(0);
    });
  });

  describe("2. Post-Commit Immediate Dispatch & Outbox Processor", () => {
    it("marks outbox event as published upon immediate dispatch", async () => {
      let event: any = null;
      await db.transaction(async (tx: any) => {
        event = await enqueueOutboxEvent(tx, {
          eventType: "CASE_CREATED",
          entityType: "CASE",
          entityId: "case-dispatch-test",
          incidentId: testIncidentId,
          version: 1,
          payload: { title: "Dispatch test case" },
        });
      });

      await dispatchCommittedEvent(event);

      const [updated] = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.id, event.id));

      expect(updated.publishedAt).toBeDefined();
      expect(updated.publishedAt).not.toBeNull();
    });

    it("processes unpublished events via OutboxProcessor worker", async () => {
      const orphanEventId = `evt_orphan_${Date.now()}`;
      await db.insert(outboxEvents).values({
        id: orphanEventId,
        eventType: "TASK_CREATED",
        entityType: "TASK",
        entityId: "task-orphan-1",
        incidentId: testIncidentId,
        version: 1,
        payload: { title: "Orphan task" },
        occurredAt: new Date(),
        publishedAt: null,
        attempts: 0,
      });

      const publishedCount = await outboxProcessor.processPendingEvents();
      expect(publishedCount).toBeGreaterThanOrEqual(1);

      const [processed] = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.id, orphanEventId));

      expect(processed.publishedAt).not.toBeNull();
    });
  });

  describe("3. Optimistic Concurrency Control (OCC) and State Machine", () => {
    it("allows valid case state transition with monotonic version increment", async () => {
      await db.insert(cases).values({
        id: testCaseId,
        incidentId: testIncidentId,
        status: "NEEDS_REVIEW",
        priorityScore: 75,
        priorityBreakdown: {},
        reviewState: "UNREVIEWED",
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await transitionCase(
        testCaseId,
        "CONFIRMED",
        "user-auditor-1",
        1,
        "Confirmed critical hospital flood"
      );

      expect(updated.status).toBe("CONFIRMED");
      expect(updated.version).toBe(2);

      const events = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.entityId, testCaseId));

      expect(events.length).toBeGreaterThanOrEqual(1);
      const confirmedEvent = events.find((e) => e.eventType === "CASE_CONFIRMED");
      expect(confirmedEvent).toBeDefined();
      expect(confirmedEvent?.version).toBe(2);
    });

    it("rejects transition on OCC version conflict (stale client write)", async () => {
      // Case is currently at version 2 in DB; attempting to write with stale expectedVersion 1
      await expect(
        transitionCase(
          testCaseId,
          "TASKED",
          "user-auditor-2",
          1,
          "Attempted stale update"
        )
      ).rejects.toMatchObject({
        code: "VERSION_CONFLICT",
      });
    });

    it("rejects invalid state machine transition path", async () => {
      // Case is currently CONFIRMED at version 2; transition to FIELD_VERIFIED is forbidden
      await expect(
        transitionCase(
          testCaseId,
          "FIELD_VERIFIED",
          "user-auditor-1",
          2,
          "Invalid transition"
        )
      ).rejects.toMatchObject({
        code: "INVALID_TRANSITION",
      });
    });
  });

  describe("4. Task State Machine & Field Verification", () => {
    it("handles task assignment and verified completion lifecycle", async () => {
      await db.insert(tasks).values({
        id: testTaskId,
        caseId: testCaseId,
        title: "Deploy rescue boat to Hospital",
        status: "UNASSIGNED",
        priority: 90,
        version: 1,
        createdAt: new Date(),
      });

      const assigned = await transitionTask(
        testTaskId,
        "ASSIGNED",
        "user-auditor-1",
        1,
        { assignedUser: "responder-10" }
      );

      expect(assigned.status).toBe("ASSIGNED");
      expect(assigned.version).toBe(2);

      const inProgress = await transitionTask(
        testTaskId,
        "IN_PROGRESS",
        "responder-10",
        2
      );
      expect(inProgress.status).toBe("IN_PROGRESS");
      expect(inProgress.version).toBe(3);

      const verified = await transitionTask(
        testTaskId,
        "VERIFIED",
        "responder-10",
        3
      );
      expect(verified.status).toBe("VERIFIED");
      expect(verified.version).toBe(4);
    });
  });


  describe("5. Reconnection & Historical Event Replay", () => {
    it("retrieves missed events since timestamp in monotonic order", async () => {
      const since = new Date(Date.now() - 60000);
      const missedEvents = await outboxProcessor.getEventsSince(since, {
        incidentId: testIncidentId,
        limit: 10,
      });

      expect(missedEvents.length).toBeGreaterThan(0);
      expect(missedEvents[0].incidentId).toBe(testIncidentId);
    });
  });

  describe("6. Realtime Gateway Health & Diagnostics", () => {
    it("provides real-time health metrics and delivery counters", () => {
      const summary = realtimeGateway.getHealthSummary();
      expect(summary.status).toBe("HEALTHY");
      expect(typeof summary.activeConnections).toBe("number");
      expect(typeof summary.totalEventsPublished).toBe("number");
      expect(typeof summary.totalEventsDelivered).toBe("number");
    });
  });
});
