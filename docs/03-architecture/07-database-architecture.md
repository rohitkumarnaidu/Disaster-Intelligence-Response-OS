---
id: database-architecture
title: Database Architecture & Persistence
sidebar_label: Database Architecture
sidebar_position: 7
---

# Database Architecture & Persistence

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes PostgreSQL 15 as its authoritative relational datastore, managed via TypeScript-native Drizzle ORM schemas.

```mermaid
erDiagram
    users ||--o{ incidents : creates
    users ||--o{ reviews : conducts
    users ||--o{ tasks : assigned_to
    users ||--o{ audit_events : logs
    users ||--o{ evidence : uploads

    incidents ||--o{ imagery_assets : contains
    incidents ||--o{ detections : identifies
    incidents ||--o{ cases : encapsulates
    incidents ||--o{ weather_alerts : receives
    incidents ||--o{ disaster_events : records
    incidents ||--o{ fire_detections : tracks

    imagery_assets ||--o{ detections : generates
    imagery_assets ||--o{ imagery_pairs : pairs

    critical_assets ||--o{ cases : associates
    detections ||--o| cases : triggers

    cases ||--o{ evidence : holds
    cases ||--o{ reviews : adjudicates
    cases ||--o{ tasks : spawns
    cases ||--o{ field_observations : verifies
    cases ||--o{ case_status_history : tracks
    cases ||--o| outcomes : concludes

    tasks ||--o{ field_observations : directs
```

---

## Schema Design Principles

1. **Structured JSONB for Geometries**: All spatial geometries (AOI polygons, asset points, detection bounds) are stored as GeoJSON in `jsonb` columns, providing flexible spatial operations without requiring external spatial database extensions.
2. **Monotonic Versioning**: Tables subject to concurrent operations (`cases`, `tasks`, `field_observations`) include a `version` integer column for Optimistic Concurrency Control.
3. **Immutable Audit Trails**: Status changes and operational decisions are recorded in append-only tables (`case_status_history`, `audit_events`, `ai_decision_logs`).
4. **Session Persistence**: Express sessions are stored directly in PostgreSQL via `connect-pg-simple`, enabling horizontal scaling across API server instances.
