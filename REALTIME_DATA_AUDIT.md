# DRAXELYRA REAL-TIME DATA AUDIT
## Screen & Component Real-Time Matrix (Zero Trust)

============================================================
1. ARCHITECTURAL OVERVIEW
============================================================

The DRAXELYRA Real-Time System operates on strict Zero-Trust principles:
- **Single Source of Truth**: PostgreSQL / PGlite database.
- **Transactional Outbox Pattern**: No event is published before its corresponding database transaction commits.
- **Post-Commit Immediate Push**: Sub-10ms event delivery via WebSocket (`/ws`) to authenticated clients.
- **Background Delivery Guarantee**: OutboxProcessor background worker guarantees at-least-once delivery for unacknowledged events.
- **Granular Query Invalidation**: Frontend TanStack Query cache invalidates specific query families without full page reload.
- **Multi-Tab Sync**: Web BroadcastChannel (`draxelyra_realtime_sync`) coordinates open tabs concurrently.
- **Monotonic Versioning & Gap Recovery**: Entity version tracking detects sequence gaps and triggers authoritative state synchronization upon reconnection.

============================================================
2. COMPONENT REAL-TIME DATA MATRIX
============================================================

| Screen / Component | File Path | DB Source of Truth | Real-Time Events Listened To | Query Keys Invalidated | OCC & Conflict Protection | Multi-Tab Synchronized |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Command Center (Incident Overview)** | `artifacts/draxelyra/src/App.tsx` | `incidents`, `cases`, `tasks`, `processing_jobs` | `INCIDENT_UPDATED`, `CASE_CONFIRMED`, `CASE_CREATED`, `TASK_STATUS_CHANGED`, `AI_JOB_COMPLETED` | `['command-summary']`, `['incidents']` | Yes (`version`) | Yes (`BroadcastChannel`) |
| **Priority Queue (Triage Table)** | `artifacts/draxelyra/src/App.tsx` (`CasesView`) | `cases`, `detections`, `critical_assets` | `CASE_CREATED`, `CASE_CONFIRMED`, `CASE_REJECTED`, `CASE_UNCERTAIN`, `CASE_TASKED`, `CASE_CLOSED` | `['cases']`, `['/api/cases']`, `['cases', incidentId]` | Yes (`version: integer`, 409 on mismatch) | Yes |
| **Case Detail & Review Modal** | `artifacts/draxelyra/src/App.tsx` (`CaseDetailModal`) | `cases`, `evidence`, `audit_events`, `case_status_history` | `CASE_STATUS_CHANGED`, `EVIDENCE_UPLOADED`, `TASK_CREATED`, `AUDIT_EVENT_CREATED` | `['case', caseId]`, `['evidence', caseId]`, `['audit', caseId]` | Yes (Explicit OCC resolution modal) | Yes |
| **Incident Map (MapLibre GL)** | `artifacts/draxelyra/src/components/map/IncidentMap.tsx` | `incidents`, `cases`, `detections`, `critical_assets`, `field_observations` | `CASE_CREATED`, `CASE_CONFIRMED`, `TASK_VERIFIED`, `INCIDENT_UPDATED`, `AI_JOB_COMPLETED` | `['incident-map', incidentId]` | Reactive GeoJSON layer update without camera/viewport reset | Yes |
| **Task Operations & Dispatch** | `artifacts/draxelyra/src/App.tsx` (`TasksView`) | `tasks`, `cases`, `users` | `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_COMPLETED`, `TASK_VERIFIED` | `['tasks']`, `['/api/tasks']`, `['task', taskId]` | Yes (`version: integer`) | Yes |
| **Field Verification & Offline Sync** | `artifacts/draxelyra/src/App.tsx` (`FieldView`), `offline-sync.ts` | `field_observations`, `tasks`, `IndexedDB syncQueue` | `FIELD_OBSERVATION_SYNCED`, `TASK_VERIFIED`, `FIELD_CONFLICT_DETECTED` | `['tasks']`, `['cases']`, `['incident-map']` | IndexedDB queue replay + 409 OCC Conflict Detection | Yes |
| **AI Satellite Pipeline Dashboard** | `artifacts/draxelyra/src/components/ai/AIAssessmentPanel.tsx` | `processing_jobs`, `ai_decision_logs`, `imagery_assets` | `AI_JOB_STARTED`, `AI_JOB_COMPLETED`, `AI_JOB_FAILED`, `PROCESSING_JOB_STATUS_CHANGED` | `['processing-jobs']`, `['jobs']`, `['cases']` | Idempotent execution locks | Yes |
| **Analytics & Decision Intelligence** | `artifacts/draxelyra/src/components/ai/AIAnalyticsDashboard.tsx` | `cases`, `tasks`, `audit_events`, `damage_assessments` | `CASE_CONFIRMED`, `PRIORITY_RECALCULATED`, `TASK_COMPLETED`, `OUTCOME_RECORDED` | `['analytics']`, `['command-summary']` | Reactive computation from DB views | Yes |
| **Audit & Governance Timeline** | `artifacts/draxelyra/src/App.tsx` (`AuditTimeline`) | `audit_events` | `AUDIT_EVENT_CREATED` | `['audit-timeline']`, `['audit']` | Append-only hash chained audit log | Yes |
| **Live Feeds & Provider Status** | `artifacts/draxelyra/src/components/LiveFeedIndicator.tsx` | `data_providers`, `outbox_events` | `PROVIDER_HEALTH_CHANGED`, WebSocket Ping/Pong | `['providers']`, `['feeds']` | Active health check & connection state indicator | Yes |

============================================================
3. ZERO-TRUST EVENT VERIFICATION MATRIX
============================================================

| Workflow Action | DB Write (Tx) | Outbox Enqueue | Post-Commit Transport | Frontend Invalidation | Visible UI Mutation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Confirm Case** | Update `cases` (status='CONFIRMED', v=v+1, priorityScore) + Insert `audit_events` + Insert `case_status_history` | `outbox_events` (`CASE_CONFIRMED`, `AUDIT_EVENT_CREATED`) | WebSocket broadcast to `global`, `incident:{id}`, `case:{id}` | Invalidate `['cases']`, `['incident-map']`, `['command-summary']`, `['audit']` | Badge changes to Confirmed, priority score updates, map marker color updates, queue re-sorts |
| **Assign Task** | Update `tasks` (status='ASSIGNED', v=v+1, assignedUser) + Insert `audit_events` | `outbox_events` (`TASK_ASSIGNED`, `AUDIT_EVENT_CREATED`) | WebSocket broadcast to `global`, `task:{id}`, `user:{assignedUser}` | Invalidate `['tasks']`, `['command-summary']` | Task moves to Assigned column, assignee avatar shown, toast alert to assignee |
| **Complete Field Verification** | Update `tasks` (status='VERIFIED', v=v+1) + Update `cases` (status='FIELD_VERIFIED') | `outbox_events` (`TASK_VERIFIED`, `CASE_STATUS_CHANGED`) | WebSocket broadcast to `global`, `incident:{id}` | Invalidate `['tasks']`, `['cases']`, `['incident-map']` | Task marked verified, case updates, map marker verified status ring appears |
| **Run AI Change Detection** | Insert `processing_jobs` -> updates status ('RUNNING' -> 'SUCCEEDED') + Insert `detections` + Insert `cases` | `outbox_events` (`AI_JOB_STARTED`, `CASE_CREATED`, `AI_JOB_COMPLETED`) | WebSocket broadcast to `incident:{id}` | Invalidate `['processing-jobs']`, `['cases']`, `['incident-map']` | Progress bar animates, new cases appear live in priority queue & on map |
| **Recover After Disconnect** | Query `outbox_events` WHERE `occurred_at >= :since` | Stream events via WebSocket replay | WebSocket `EVENT` + `REPLAY_COMPLETE` | Invalidate queries matching replayed entity types | Stale UI views catch up seamlessly with server state |
