# Endpoints Reference
<span className="badge-implemented">Implemented</span>

Comprehensive reference of available DRAXELYRA REST API endpoints.

## Auth

- `POST /api/auth/login`
  - Payload: `{ email, password }`
  - Action: Verifies via bcrypt, establishes session. Returns user object (excludes passwordHash).
  - Errors: 400, 401, 500
- `POST /api/auth/logout`
  - Requires: Authentication
  - Action: `session.destroy()`. Returns `{ success: true }`
- `GET /api/auth/me`
  - Requires: Authentication
  - Action: Retrieves user via `session.userId`. Errors: 404.

## Incidents

- `GET /api/incidents`
  - Requires: Authentication
  - Action: Returns all incidents ordered by `updatedAt` descending.
- `POST /api/incidents`
  - Requires: Roles `[System Admin, Organization Admin, Disaster Officer]`
  - Action: Provisions a new incident workspace.
- `GET /api/incidents/:id`
  - Requires: Authentication
  - Action: Returns incident details. Automatically falls back to Demo incident if standard lookup fails.
- `PATCH /api/incidents/:id`
  - Requires: Roles `[System Admin, Organization Admin, Disaster Officer]`
  - Action: Updates status, description, or severity.
- `GET /api/incidents/:id/map`
  - Requires: Authentication
  - Action: Returns aggregated GeoJSON (`aoi`, `cases`, `criticalAssets`, `detections`, `fieldObservations`).

## Cases

- `GET /api/cases`
  - Requires: Authentication
  - Action: Returns cases joined with related detections and critical assets. Ordered by `priorityScore` descending.
- `GET /api/cases/:id`
  - Requires: Authentication
  - Action: Detailed case record including pre/post disaster imagery dates.
- `POST /api/cases/:id/review`
  - Requires: Roles `[System Admin, Organization Admin, Disaster Officer, Manager, Analyst, Commander]`
  - Payload: `{ decision, notes, version }` (decision: confirmed/rejected/uncertain)
  - Action: Transitions state machine, recalculates priority if confirmed.
  - Returns: `{ success, newStatus, priorityScore, version }`
  - Errors: 409 VERSION_CONFLICT, 422 INVALID_TRANSITION
- `GET /api/cases/:id/audit`
  - Requires: All Roles
  - Action: Returns immutable audit events with actor names.

## Tasks

- `GET /api/tasks`
  - Requires: Authentication
  - Action: Lists tasks, calculating SLA labels and escalation flags dynamically.
- `POST /api/tasks`
  - Requires: Roles `[System Admin, Organization Admin, Disaster Officer, Manager, Commander, Response Coordinator]`
  - Action: Creates a task, auto-transitions parent case to `TASKED`.
  - SLA Calculation: priority >= 75 → 30min; >= 45 → 2h; else → 8h.
- `PATCH /api/tasks/:id`
  - Requires: Roles `[System Admin, Organization Admin, Disaster Officer, Manager, Commander, Field Responder]`
  - Payload: `{ status, version }`
  - Action: State machine transition. If status equals `VERIFIED`, auto-transitions parent case to `FIELD_VERIFIED`.

## Evidence & Uploads

- `POST /api/evidence/upload`
  - Requires: Authentication
  - Content-Type: `multipart/form-data`
  - Action: Performs MIME check, magic bytes validation, SHA-256 hashing, and prevents path traversal before committing to disk and DB.

## Analytics & Operations

- `GET /api/analytics/overview`
  - Requires: Authentication
  - Action: Returns system KPIs (cases total, needs_review, confirmed, rejected, uncertain, closed, falsePositiveRate, tasksOpen, completed, overdue, SLA compliance, scatter data, funnel, timelines).
- `GET /api/command/summary`
  - Requires: Authentication
  - Action: Fast, cached read of active incident metrics, top 5 highest priority cases, top 5 tasks, and 5 recent audit events.
- `POST /api/audit`
  - Requires: Authentication
  - Action: Inserts custom application-level audit events.

## System & Demo

- `POST /api/demo/load`
  - Requires: Authentication
  - Action: **DESTRUCTIVE.** Purges all operational tables and seeds the demo environment (users, incident, assets, detections, hero case).
- `POST /api/demo/reset`
  - Requires: Authentication
  - Action: Convenience wrapper; redirects to `/api/demo/load`.
- `GET /api/healthz`
  - Action: Returns `{ status: 'ok' }`. Unauthenticated liveness probe.
