/**
 * DRAXELYRA Real-Time Event Contracts & Schemas
 * Standardized typed domain events, WebSocket messages, and channel subscriptions.
 */

export type EntityType =
  | "INCIDENT"
  | "CASE"
  | "TASK"
  | "EVIDENCE"
  | "FIELD_OBSERVATION"
  | "OUTCOME"
  | "AI_JOB"
  | "PROCESSING_JOB"
  | "PROVIDER"
  | "ALERT"
  | "DETECTION"
  | "AUDIT";

export type EventType =
  | "INCIDENT_CREATED"
  | "INCIDENT_UPDATED"
  | "INCIDENT_CLOSED"
  | "CASE_CREATED"
  | "CASE_REVIEWED"
  | "CASE_CONFIRMED"
  | "CASE_REJECTED"
  | "CASE_UNCERTAIN"
  | "CASE_PRIORITIZED"
  | "CASE_TASKED"
  | "CASE_STATUS_CHANGED"
  | "CASE_CLOSED"
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_REASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_STARTED"
  | "TASK_BLOCKED"
  | "TASK_COMPLETED"
  | "TASK_VERIFIED"
  | "TASK_CLOSED"
  | "EVIDENCE_UPLOADED"
  | "EVIDENCE_VALIDATED"
  | "FIELD_OBSERVATION_CREATED"
  | "FIELD_OBSERVATION_SYNCED"
  | "FIELD_CONFLICT_DETECTED"
  | "FIELD_CONFLICT_RESOLVED"
  | "OUTCOME_RECORDED"
  | "PRIORITY_RECALCULATED"
  | "AI_JOB_STARTED"
  | "AI_JOB_COMPLETED"
  | "AI_JOB_FAILED"
  | "PROCESSING_JOB_STATUS_CHANGED"
  | "AUDIT_EVENT_CREATED"
  | "ALERT_CREATED"
  | "FIRE_DETECTION_CREATED"
  | "PROVIDER_HEALTH_CHANGED";

export interface DomainEvent<T = any> {
  id: string;
  type: EventType;
  entityType: EntityType;
  entityId: string;
  incidentId?: string | null;
  organizationId?: string | null;
  version: number;
  occurredAt: string; // ISO 8601 string
  actorId?: string | null;
  correlationId?: string | null;
  data: T;
}

export type ClientMessage =
  | { type: "SUBSCRIBE"; channels: string[] }
  | { type: "UNSUBSCRIBE"; channels: string[] }
  | { type: "PING" }
  | {
      type: "RECOVER";
      sinceTimestamp?: string;
      lastEventId?: string;
      lastVersions?: Record<string, number>;
    };

export type ServerMessage =
  | { type: "EVENT"; event: DomainEvent }
  | { type: "SUBSCRIBED"; channels: string[] }
  | { type: "UNSUBSCRIBED"; channels: string[] }
  | { type: "ERROR"; code: string; message: string }
  | { type: "PONG" }
  | { type: "REPLAY_COMPLETE"; replayedCount: number }
  | {
      type: "GAP_DETECTED";
      entityType: EntityType;
      entityId: string;
      expectedVersion: number;
      receivedVersion: number;
    };

export interface AuthenticatedUserSession {
  userId: string;
  name: string;
  role: string;
  email: string;
  organizationId?: string | null;
}
