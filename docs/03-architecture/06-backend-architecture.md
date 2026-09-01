---
id: backend-architecture
title: Backend Architecture & Service Organization
sidebar_label: Backend Architecture
sidebar_position: 6
---

# Backend Architecture & Service Organization

<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend is an Express 5 application organized as a modular monolith. It separates HTTP routing, middleware validation, domain services, database models, and real-time gateways into clean, decoupled modules.

```mermaid
flowchart TD
    subgraph ExpressApp["Express 5 Server (artifacts/api-server/src/)"]
        ENTRY[index.ts & app.ts]
        MIDDLEWARE[Middlewares: CookieParser, Session, requireAuth, requireRole, Logger]
        ROUTERS[Routes: /auth, /incidents, /cases, /tasks, /evidence, /ai, /demo]
    end

    subgraph Services["Domain Service Layer (src/services/)"]
        FSM_CASE[case-state-machine.ts]
        FSM_TASK[task-state-machine.ts]
        INGEST[ingestion-engine.ts]
        AI_SVC[damage-assessment.ts]
        ASSET_SVC[asset-enrichment.ts]
        OSM_SVC[osm-sync.ts]
        JOB_RUNNER[job-runner.ts]
    end

    subgraph Realtime["Real-Time Engine (src/realtime/)"]
        OUTBOX[outbox.ts Transactional Outbox Worker]
        GATEWAY[gateway.ts WebSocket Server /ws]
        CONTRACTS[contracts.ts Event Typings]
    end

    subgraph DatabasePackage["Shared DB Package (@workspace/db)"]
        DRIZZLE[Drizzle ORM Connection Pool]
        SCHEMA[schema/index.ts 18 PostgreSQL Tables]
    end

    ENTRY --> MIDDLEWARE --> ROUTERS
    ROUTERS --> Services
    Services --> Realtime
    Services --> DatabasePackage
    Realtime --> DatabasePackage
```

---

## Source Directory Organization

- `artifacts/api-server/src/app.ts`: Express application factory and middleware configuration.
- `artifacts/api-server/src/index.ts`: HTTP and WebSocket server bootstrap on port 3000.
- `artifacts/api-server/src/routes/`: 18 modular Express route files handling specific API resources.
- `artifacts/api-server/src/services/`: Business logic, state machines, and background ingestion engines.
- `artifacts/api-server/src/ai/`: Multimodal AI providers, prompt templates, and schema validators.
- `artifacts/api-server/src/realtime/`: WebSocket gateway, connection registry, and transactional outbox.
- `lib/db/`: Drizzle ORM schema, migration scripts, and database connection pooling.
