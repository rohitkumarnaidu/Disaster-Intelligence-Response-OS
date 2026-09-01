# DRAXELYRA — FINAL REAL-TIME ARCHITECTURE AUDIT
**Disaster Intelligence & Response OS**
*Certified: 2026-09-01 | Realtime Engine: WebSocket Gateway + Transactional Outbox*

---

## 1. Realtime Subsystem Architecture

The DRAXELYRA real-time architecture guarantees transactional consistency, crash recovery, and multi-tenant channel isolation for critical field operations and emergency triage centers.

```
[ Domain Mutation (REST / Ingestion) ]
               │
               ▼  (Within Atomic SQL Transaction)
[ Database Commit + outbox_events Insert ]
               │
               ▼  (After Commit Dispatch)
[ RealtimeGateway (/ws) ] ──────► [ Connected Operators / Field Officers ]
               │
               ├── Channel: `global`
               ├── Channel: `incident:<id>`
               ├── Channel: `case:<id>`
               ├── Channel: `user:<id>`
               └── Channel: `org:<id>`
```

---

## 2. Security & Session Authentication
- **Endpoint**: `GET /ws` (WebSocket Upgrade over HTTP/1.1 & HTTP/2).
- **Authentication**: Express session cookie (`connect.sid`) extracted and decrypted on initial WebSocket handshake. Unauthenticated connections are closed with code `4401 (Unauthorized)`.
- **RBAC Filtering**: Subscriptions to sensitive administrative channels (`org:<id>`, `user:<id>`) require verified role permissions matching the authenticated user's organization.

---

## 3. Transactional Outbox Pattern & Zero Event Loss
- **Persistence Table**: `outbox_events` (`id`, `event_type`, `entity_type`, `entity_id`, `incident_id`, `version`, `payload`, `occurred_at`, `published_at`, `attempts`).
- **Atomic Guarantee**: Every business entity change (Case Review, Task Assignment, Alert Ingestion, Hotspot Detection) inserts the outbox event in the same ACID transaction as the entity table.
- **Commit Hook**: The in-memory gateway broadcasts via `dispatchCommittedEvent()` only after the database transaction has successfully committed.

---

## 4. Standard Domain Event Contracts

| Event Type | Entity Type | Triggering Action | Target Channels |
| :--- | :--- | :--- | :--- |
| `INCIDENT_CREATED` | `INCIDENT` | New disaster declared or ingested | `global` |
| `CASE_CREATED` | `CASE` | High-priority hazard case triaged | `global`, `incident:<id>` |
| `CASE_CONFIRMED` | `CASE` | Human analyst confirms damage | `global`, `incident:<id>`, `case:<id>` |
| `CASE_REJECTED` | `CASE` | False positive marked by reviewer | `global`, `incident:<id>`, `case:<id>` |
| `TASK_ASSIGNED` | `TASK` | Responder assigned to field action | `incident:<id>`, `user:<id>` |
| `TASK_COMPLETED` | `TASK` | Field task marked complete with photo | `incident:<id>`, `case:<id>` |
| `ALERT_CREATED` | `ALERT` | SACHET / IMD severe warning ingested | `global`, `incident:<id>` |
| `FIRE_DETECTION_CREATED` | `DETECTION` | NASA FIRMS thermal anomaly detected | `global`, `incident:<id>` |
| `AUDIT_EVENT_CREATED` | `AUDIT` | Tamper-evident log recorded | `incident:<id>`, `case:<id>` |

---

## 5. Recovery, Gap Detection & History Replay
- **Replay Message**: `{ type: "RECOVER", sinceTimestamp: "2026-09-01T12:00:00Z", lastEventId: "evt_..." }`
- **Gap Detection**: If an operator receives version $v+2$ without having received $v+1$, the client automatically emits a `GAP_DETECTED` recovery request to query missed events from `outbox_events`.
