---
id: pages
title: Frontend Page-by-Page Technical Reference
sidebar_label: Pages Reference
sidebar_position: 2
---

# Frontend Page-by-Page Technical Reference

<span className="badge-implemented">Implemented</span>

DRAXELYRA routes are managed via Wouter inside `artifacts/draxelyra/src/App.tsx`. Every route is documented below with its component, permissions, data hooks, and mutation actions.

---

## Complete Routing Matrix

| Route | Component Name | Required Roles | Primary TanStack Query Keys | Mutations Executed |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `CommandCenter` | All Authenticated | `['command-summary']`, `['incidents']` | Sync Live Feeds (`POST /api/demo/load-live`) |
| `/login` | `Login` | Public (No Auth) | None | `login()` (`POST /api/auth/login`) |
| `/incidents` | `Incidents` | All Authenticated | `['incidents']` | Create Incident |
| `/incidents/:id` | `IncidentDetail` | All Authenticated | `['incident', id]`, `['cases', id]` | Update Incident Status |
| `/imagery/search` | `ImagerySearchPage` | GIS Analyst, Commander | `['imagery-catalog']` | STAC Search (`POST /api/imagery/search`) |
| `/assessment` | `Assessment` | GIS Analyst, Duty Officer | `['incident-map', id]`, `['cases']` | Layer Toggles, Centroid Pan |
| `/cases` | `Cases` | All Authenticated | `['cases']`, `['command-summary']` | Filter & Sort State |
| `/cases/:id` | `CaseDetail` | Duty Officer, Commander | `['case', id]`, `['audit', id]` | Adjudicate (`POST /api/cases/:id/review`) |
| `/tasks` | `Tasks` | Field Lead, Commander | `['tasks']`, `['cases']` | Transition (`PATCH /api/tasks/:id`) |
| `/tasks/:id` | `TaskDetail` | Field Lead, Responder | `['task', id]` | Verify Task (`POST /api/tasks/:id/verify`) |
| `/field` | `Field` | Field Responder, Lead | `['offline-queue']` (IndexedDB) | Queue Observation (`queueRequest`) |
| `/data-sources` | `DataSourcesPage` | System Admin, Commander | `['data-sources']`, `['feeds']` | Trigger Sync (`POST /api/integrations/sync`) |
| `/analytics` | `Analytics` | Incident Commander | `['analytics']`, `['metrics']` | Generate Report (`POST /api/ai/report`) |
| `/demo` | `Demo` | All Authenticated | None | Load Demo (`POST /api/demo/load`), Reset |
| `/settings` | `Settings` | System Admin | `['users']`, `['settings']` | Toggle Integrations, User Management |
| `*` | `NotFound` | Public | None | None |
