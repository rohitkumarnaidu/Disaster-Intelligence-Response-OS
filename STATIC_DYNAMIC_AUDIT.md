# DRAXELYRA — Static vs Dynamic Data Audit (STATIC_DYNAMIC_AUDIT.md)

## Audit Methodology & Zero-Trust Verification

Every screen and operational component in DRAXELYRA has been audited against the **Zero-Trust Principle**:
- Prove that operational figures, status badges, map layers, candidate queues, priority breakdowns, tasks, field observations, audit trails, and analytics are dynamically fetched from the PostgreSQL database via typed REST/SSE endpoints.
- Confirm that no hardcoded fallback datasets or fabricated operational metrics mask API/database errors.

---

## Screen-by-Screen Dynamic Audit Matrix

| Screen / Workspace | Route | Data Source & API | Query Key | Database Entity | Mutations & State Machine | Static Elements | Dynamic Telemetry / Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Login** | `/login` | `POST /api/auth/login` | Session Auth | `users` | Auth Session Creation | Branding & Role Descriptions | Authenticated Session Cookie |
| **Command Center** | `/` | `GET /api/command/summary`, `GET /api/incidents/:id/map` | `getCommandSummary`, `incident-map` | `incidents`, `cases`, `tasks`, `critical_assets` | Auto-refresh via SSE & 30s Polling | UI Layout Grid | Dynamic Incident Metrics, Priority Queue Count, Map Layers |
| **Incidents** | `/incidents` | `GET /api/incidents` | `listIncidents` | `incidents` | `POST /api/incidents`, `PATCH /api/incidents/:id` | Table Headers | Real Ingested Disasters, Active Statuses, Timestamps |
| **Incident Detail** | `/incidents/:id` | `GET /api/incidents/:id`, `GET /api/incidents/:id/map` | `getIncident`, `incident-map` | `incidents`, `cases`, `critical_assets` | Incident Status Patch | Section Titles | AOI Extent, Bounding Box, Weather Panel |
| **Geospatial Assessment** | `/assessment` | `GET /api/cases`, `GET /api/incidents/:id/map`, `GET /api/imagery` | `listCases`, `incident-map`, `imagery-list` | `cases`, `detections`, `imagery_assets`, `osm_critical_assets` | `POST /api/processing/jobs` (Change Detection) | Filter Categories | Satellite Swaths, Candidate Detections, Dynamic Priority |
| **Satellite Discovery** | `/imagery/search` | `POST /api/imagery/search`, `POST /api/imagery/import` | `imagery-search` | `imagery_assets` | Ingest Catalog Product | Form Labels | Live Copernicus STAC Results, Footprint BBox, Quality Status |
| **Data Sources** | `/data-sources` | `GET /api/data-sources/health`, `GET /api/integrations/osm/status` | `data-sources-health`, `osm-status` | `data_sources`, `osm_critical_assets` | `POST /api/integrations/osm/sync` (OSM Overpass) | Attribution Text | Live Provider Latency (ms), Auth Status, Cached Asset Count |
| **Priority Queue** | `/cases` | `GET /api/cases` | `listCases` | `cases`, `detections`, `critical_assets` | FSM Transitions | Sorting Options | 5-Factor Priority (0-100), Review State, Asset Class |
| **Case Detail** | `/cases/:id` | `GET /api/cases/:id`, `GET /api/cases/:id/lineage`, `GET /api/cases/:id/audit` | `getCase`, `case-lineage`, `case-audit` | `cases`, `evidence`, `audit_events`, `processing_jobs` | Dispatch Field Task | Formula Explanation | Full Lineage Graph, Pre/Post Imagery, Priority Breakdown |
| **Evidence Review** | `/review/:id` | `GET /api/cases/:id`, `POST /api/cases/:id/review` | `getCase` | `cases`, `reviews`, `audit_events` | `transitionCase` (CONFIRMED / REJECTED / UNCERTAIN) | Decision Explanations | OCC Version Check, Recomputed Priority, Review History |
| **Response Tasks** | `/tasks` | `GET /api/tasks` | `listTasks` | `tasks`, `cases`, `users` | `POST /api/tasks`, `PATCH /api/tasks/:id` | Priority Labels | Assigned Responder, Due Time, SLA Status, Escalation |
| **Task Detail** | `/tasks/:id` | `GET /api/tasks/:id` | `getTask` | `tasks`, `cases`, `audit_events` | Status Transitions (ASSIGNED to IN_PROGRESS to COMPLETED) | Action Buttons | FSM State, Audit Log, Due Time |
| **Field Verification** | `/field` | `GET /api/tasks`, `POST /api/evidence/upload` | `listTasks`, IndexedDB Offline Queue | `field_observations`, `evidence`, `tasks` | Upload Multipart Evidence, Sync Observations | Camera / GPS Placeholders | Local Offline Storage, Magic-Byte Inspection, Checksum |
| **Analytics** | `/analytics` | `GET /api/analytics/overview` | `analytics-overview` | `cases`, `tasks`, `incidents`, `audit_events` | Dynamic Query Aggregation | Metric Tooltips | SLA Compliance %, False Positive %, Funnel, Avg Times |
| **Settings & Feeds** | `/settings` | `GET /api/feeds`, `GET /api/weather/alerts` | `feeds`, `weather-alerts` | `external_feeds`, `weather_alerts` | Configure Ingestion Intervals | System Role Descriptions | Active Background Ingestion Engines & Real Feeds |
| **Demo Replay** | `/demo` | `POST /api/demo/load`, `POST /api/demo/reset` | `demo-load` | All Tables | Idempotent Seed / Reset Pipeline | Scenario Stepper | Deterministic Seed Execution & Lineage |

---

## Static Data Audit: Zero Fake Operational Data Policy

- **All Map Layers**: Bounding boxes, critical assets, AI detections, priority cases, field observations, and satellite footprints originate directly from `/api/incidents/:id/map` GeoJSON stream generated from database records.
- **Priority Scores**: Calculated authoritatively on the backend by `calculatePriority()` in `artifacts/api-server/src/lib/priority.ts`. Any client-submitted scores are ignored.
- **Analytics**: Computed dynamically in `artifacts/api-server/src/routes/analytics.ts` from live database rows.
- **Audit Trails**: Created authoritatively by backend state machines (`CaseStateMachine`, `TaskStateMachine`) using authenticated session user IDs and server timestamps.
