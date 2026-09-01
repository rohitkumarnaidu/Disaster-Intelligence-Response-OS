---
id: event-contracts
title: Domain Event Types & Schema Contracts
sidebar_label: Event Contracts
sidebar_position: 3
---

# Domain Event Types & Schema Contracts

<span className="badge-implemented">Implemented</span>

**Source File**: [`artifacts/api-server/src/realtime/contracts.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/realtime/contracts.ts)

Every real-time event conforms to a strictly typed envelope:

```typescript
export type RealtimeEventType =
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'CASE_CREATED'
  | 'CASE_CONFIRMED'
  | 'CASE_REJECTED'
  | 'CASE_TASKED'
  | 'TASK_ASSIGNED'
  | 'TASK_VERIFIED'
  | 'TASK_COMPLETED'
  | 'WEATHER_ALERT_RECEIVED'
  | 'FIRE_DETECTION_RECEIVED'
  | 'AUDIT_EVENT_CREATED';

export interface DomainEventEnvelope<T = any> {
  id: string;
  eventType: RealtimeEventType;
  entityType: 'INCIDENT' | 'CASE' | 'TASK' | 'WEATHER' | 'FIRE' | 'AUDIT';
  entityId: string;
  version: number;
  incidentId?: string;
  timestamp: string;
  payload: T;
}
```
