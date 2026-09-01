import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(dir, relPath, content) {
  const fullPath = path.join(dir, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

export function generateArch(docsDir) {
  console.log('Generating 03-architecture, 04-frontend, and 05-backend...');

  // ===========================================================================
  // 03-architecture
  // ===========================================================================

  // 03-architecture/01-system-architecture.md
  writeFile(docsDir, '03-architecture/01-system-architecture.md', `---
id: system-architecture
title: System Architecture & Subsystem Topology
sidebar_label: System Architecture
sidebar_position: 1
---

# System Architecture & Subsystem Topology

<span className="badge-implemented">Implemented</span>

DRAXELYRA is architected as a modular, resilient operational monolith designed to process multi-hazard geospatial telemetry, execute multimodal computer vision analysis, and coordinate distributed emergency response operations under severe network degradation.

\`\`\`mermaid
flowchart TB
    subgraph Clients["Presentation & Edge Layer"]
        UI["Web Command Console (React 19 / Vite / Tailwind v4)"]
        PWA["Field Verification Mobile PWA (Offline / IndexedDB)"]
        WS_CLIENT["Realtime Client (WebSocket / BroadcastChannel)"]
    end

    subgraph Gateway["Ingress & Transport Layer"]
        HTTP_GW["Express 5 HTTP Gateway (:3000)"]
        WS_GW["WebSocket Gateway (/ws)"]
        SSE_GW["Server-Sent Events Stream (/api/events)"]
        SESSION["connect-pg-simple Session Manager"]
    end

    subgraph CoreServices["Domain Service Layer"]
        INGEST["IngestionEngine (Cron Pollers / CAP Ingest)"]
        STATE_CASE["Case State Machine (FSM & CAS OCC)"]
        STATE_TASK["Task State Machine (FSM & SLA Engine)"]
        PRIORITY["Explainable 5-Factor Priority Engine"]
        AI_SVC["Damage Assessment & Multimodal AI Service"]
        ENRICH["Asset Enrichment & OSM Sync Service"]
        OUTBOX_SVC["Transactional Outbox Dispatcher"]
    end

    subgraph DataLayer["Persistence & Storage Layer"]
        DB[("PostgreSQL 15 Primary Datastore")]
        TABLES["18 Tables: cases, tasks, incidents, evidence, audit_events, outbox_events"]
        FS["Evidence & Imagery Storage (/uploads)"]
        IDB[("Browser IndexedDB (draxelyra-offline)")]
    end

    subgraph ExternalFeeds["External Intelligence Providers"]
        EXT_SACHET["SACHET India NDMA CAP Alerts"]
        EXT_USGS["USGS Hazards Earthquake Feed"]
        EXT_GDACS["GDACS Multi-Hazard Alerts"]
        EXT_FIRMS["NASA FIRMS VIIRS Active Fire Hotspots"]
        EXT_METEO["Open-Meteo & OpenWeatherMap Feeds"]
        EXT_COP["Copernicus CDSE Sentinel-1 SAR & Sentinel-2 STAC"]
        EXT_OSM["OpenStreetMap Overpass API"]
        EXT_GEMINI["Google Gemini 2.5 Flash Multimodal API"]
    end

    UI --> HTTP_GW
    UI --> WS_GW
    PWA --> HTTP_GW
    PWA --> IDB
    WS_CLIENT --> WS_GW
    WS_CLIENT --> SSE_GW

    HTTP_GW --> SESSION
    HTTP_GW --> STATE_CASE
    HTTP_GW --> STATE_TASK
    HTTP_GW --> PRIORITY
    HTTP_GW --> AI_SVC
    HTTP_GW --> ENRICH

    INGEST --> EXT_SACHET
    INGEST --> EXT_USGS
    INGEST --> EXT_GDACS
    INGEST --> EXT_FIRMS
    INGEST --> EXT_METEO
    ENRICH --> EXT_OSM
    AI_SVC --> EXT_COP
    AI_SVC --> EXT_GEMINI

    STATE_CASE --> DB
    STATE_TASK --> DB
    AI_SVC --> DB
    ENRICH --> DB
    INGEST --> DB

    DB --> OUTBOX_SVC
    OUTBOX_SVC --> WS_GW
    OUTBOX_SVC --> SSE_GW
\`\`\`

---

## Subsystem Functional Responsibilities

### 1. Presentation & Field Edge Layer
- **Command Center Web Console**: Built with React 19, Tailwind CSS v4, and Radix UI primitives. Renders high-density operational views, spatial layers, and evidence review boards.
- **Field Verification PWA**: Touch-optimized interface running on mobile tablets with offline IndexedDB request buffering and camera evidence capture.
- **Realtime Channel Synchronizer**: Manages WebSocket connection lifecycle, 25s ping-pong heartbeats, and cross-tab event synchronization via the browser \`BroadcastChannel\` API.

### 2. Ingress & Realtime Transport Layer
- **Express 5 HTTP API Gateway**: Enforces cookie-based session authentication, RBAC middleware, payload validation, and CORS policies.
- **WebSocket Gateway (\`/ws\`)**: Authenticates connection upgrades against the PostgreSQL session table, maintains channel subscriptions (\`global\`, \`incident:id\`, \`case:id\`, \`task:id\`), and broadcasts domain events.
- **Server-Sent Events (\`/api/events\`)**: Unidirectional streaming fallback for environments restricting WebSocket traffic.

### 3. Domain Service Layer
- **Case State Machine**: Strictly validates finite state transitions (\`DETECTED\` to \`CLOSED\`), records immutable status histories, and executes atomic Compare-and-Swap (CAS) version increments.
- **Task State Machine**: Converts confirmed cases into assigned tasks, computes dynamic priority-based SLA deadlines, and tracks field verification.
- **Priority Engine**: Computes deterministic, explainable scores ($0\\text{--}100$) using 5 distinct risk factors with 72-hour time decay.
- **Multimodal AI Service**: Integrates Google Gemini 2.5 Flash and deterministic baseline vision models for change detection, structuring outputs into validated Zod schemas.
- **Transactional Outbox Dispatcher**: Polls the \`outbox_events\` table and dispatches committed domain events asynchronously, guaranteeing zero event loss without two-phase commit overhead.

### 4. Persistence & Storage Layer
- **PostgreSQL 15 Datastore**: Primary relational source of truth managed via Drizzle ORM schemas, housing 18 structured tables with JSONB geometry columns.
- **Evidence Storage**: Local filesystem directory (\`./uploads\`) with magic-byte MIME verification and SHA-256 integrity checksums.
- **IndexedDB (\`draxelyra-offline\`)**: Client-side object store buffering field mutations during total communications blackout.
`);

  // 03-architecture/02-architecture-principles.md
  writeFile(docsDir, '03-architecture/02-architecture-principles.md', `---
id: architecture-principles
title: Core Architectural Principles
sidebar_label: Architectural Principles
sidebar_position: 2
---

# Core Architectural Principles

<span className="badge-implemented">Implemented</span>

DRAXELYRA's architecture is guided by six foundational principles engineered specifically for life-critical disaster response environments.

---

## 1. Zero-Trust Grounding & Explicit Status
- **Source Code is Authoritative**: Documentation, diagrams, and API contracts must reflect the actual runtime codebase.
- **Explicit Implementation Badges**: Features are explicitly tagged with their operational readiness:
  - <span className="badge-implemented">Implemented</span>: Full production source code present and verified.
  - <span className="badge-live">Real Data Mode</span>: Connected to live external APIs (USGS, GDACS, SACHET).
  - <span className="badge-dev">Development Replay</span>: Historical deterministic scenario dataset for offline training.
  - <span className="badge-mock">Mock Baseline</span>: Synthetic or baseline adapter used when API keys are absent.

---

## 2. Statistical Confidence $\\neq$ Operational Priority
In automated disaster screening, raw model confidence (e.g., *0.92 probability of standing water*) does not communicate operational consequence. DRAXELYRA enforces an explicit separation:
- **Confidence ($K$)**: Statistical uncertainty of the computer vision model or sensor reading.
- **Priority Score ($P$)**: Multi-factor decision matrix incorporating structural damage severity ($30\\%$), infrastructure criticality ($25\\%$), exposed population density ($20\\%$), emergency urgency decay ($15\\%$), and model confidence ($10\\%$).

---

## 3. Human-in-the-Loop Authority
AI models and external detection feeds generate **candidate signals**, never autonomous operational orders. An authenticated human operator (Duty Officer or Incident Commander) must review the evidence, select an authoritative decision (\`CONFIRMED\`, \`REJECTED\`, \`UNCERTAIN\`), and supply mandatory justification notes before response tasks are dispatched.

---

## 4. Optimistic Concurrency Control (OCC) & Compare-and-Swap (CAS)
In high-stress emergency operations centers, multiple watchstanders frequently inspect the same crisis queues. DRAXELYRA eliminates silent race-condition overwrites using a monotonic \`version\` column:
\`\`\`sql
UPDATE cases
SET status = :newStatus, version = :expectedVersion + 1, updated_at = NOW()
WHERE id = :caseId AND version = :expectedVersion;
\`\`\`
If another operator updated the case concurrently, the query matches zero rows and the API returns HTTP 409 \`VERSION_CONFLICT\` with the current server record.

---

## 5. Offline-First Field Resilience
Disaster zones frequently experience total cellular and power grid failure. The system treats network unavailability as a normal operating state:
- All static assets and application shells are cached by the Service Worker (\`/sw.js\`).
- Field observations, ground photos, and task status updates are queued in IndexedDB (\`syncQueue\`).
- Sequential replay occurs automatically upon connection restoration, handling conflict resolution gracefully.

---

## 6. Immutable Auditability & Cryptographic Provenance
Post-incident after-action reviews require unambiguous legal accountability. Every state transition, triage review, task assignment, and evidence upload is recorded in append-only tables (\`audit_events\`, \`case_status_history\`, \`ai_decision_logs\`) with actor IDs, timestamps, and SHA-256 content hashes.
`);

  // 03-architecture/03-request-flow.md
  writeFile(docsDir, '03-architecture/03-request-flow.md', `---
id: request-flow
title: Backend Request Lifecycle & Transaction Flow
sidebar_label: Request Flow
sidebar_position: 3
---

# Backend Request Lifecycle & Transaction Flow

<span className="badge-implemented">Implemented</span>

Every mutation request traversing the DRAXELYRA backend follows a strictly ordered, auditable lifecycle ensuring authentication, role verification, input schema validation, transactional state transition, outbox persistence, and real-time broadcast.

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Web / PWA Client
    participant Express as Express Gateway
    participant Session as Session & Auth Middleware
    participant Route as Case Route Handler
    participant FSM as Case State Machine
    participant DB as PostgreSQL Transaction (ACID)
    participant Outbox as Transactional Outbox
    participant WS as WebSocket Gateway (/ws)

    Client->>Express: POST /api/cases/:id/review (Cookie: connect.sid)
    Express->>Session: requireAuth & requireRole("Duty Officer", "Incident Commander")
    Session-->>Express: Session Valid (userId="usr_123", role="Duty Officer")

    Express->>Route: Execute Route Controller
    Route->>FSM: transitionCase(caseId, "CONFIRMED", userId, expectedVersion=2, notes)
    
    rect rgb(240, 248, 255)
        note over FSM,DB: PostgreSQL ACID Transaction Boundary
        FSM->>DB: SELECT * FROM cases WHERE id = :id FOR UPDATE
        DB-->>FSM: Case Record (status="DETECTED", version=2)
        FSM->>FSM: Validate FSM Transition (DETECTED -> CONFIRMED)
        FSM->>FSM: Validate Version (expectedVersion === record.version)
        
        FSM->>DB: UPDATE cases SET status="CONFIRMED", version=3 WHERE id=:id AND version=2
        FSM->>DB: INSERT INTO case_status_history (id, case_id, from_status, to_status, user, reason)
        FSM->>DB: INSERT INTO audit_events (id, actor_id, entity_type, entity_id, action, metadata)
        FSM->>DB: INSERT INTO outbox_events (id, event_type, entity_id, version, payload)
        DB-->>FSM: Transaction Committed Successfully
    end

    FSM-->>Route: Updated Case Object (version=3)
    Route-->>Client: HTTP 200 OK { id, status: "CONFIRMED", version: 3 }

    par Non-blocking Async Dispatch
        FSM->>Outbox: dispatchCommittedEvent(event)
        Outbox->>WS: broadcastEvent(DomainEvent: CASE_CONFIRMED)
        WS-->>Client: WebSocket Message { type: "EVENT", event: "CASE_CONFIRMED", version: 3 }
    end
\`\`\`

---

## Detailed Step-by-Step Lifecycle

1. **Transport Ingress & Cookie Parsing**: The client transmits an HTTP mutation with the signed \`connect.sid\` cookie.
2. **Authentication Verification**: \`requireAuth\` extracts the session ID, queries PostgreSQL \`session\` table, and deserializes user context.
3. **RBAC Authorization**: \`requireRole\` confirms the user's role matches permitted roles. If unauthorized, returns HTTP 403 \`FORBIDDEN\`.
4. **Input Schema Validation**: Route controllers validate request bodies against Zod schemas.
5. **ACID Transaction Execution**:
   - Acquires the current record from \`cases\`.
   - Checks that the transition from \`currentStatus\` to \`newStatus\` is valid according to \`VALID_CASE_TRANSITIONS\`.
   - Checks that \`record.version === expectedVersion\`.
   - Executes atomic SQL update with version increment.
   - Inserts audit logs into \`case_status_history\` and \`audit_events\`.
   - Inserts the domain event into \`outbox_events\`.
6. **HTTP Response**: The updated record is returned to the client.
7. **Asynchronous Outbox Dispatch**: The outbox worker pushes the event over WebSockets and SSE to all subscribed clients, triggering TanStack Query cache invalidations across the active incident theater.
`);

  // 03-architecture/04-data-flow.md
  writeFile(docsDir, '03-architecture/04-data-flow.md', `---
id: data-flow
title: Data Flow & End-to-End Lineage
sidebar_label: Data Flow
sidebar_position: 4
---

# Data Flow & End-to-End Lineage

<span className="badge-implemented">Implemented</span>

This document illustrates the end-to-end data lineage across DRAXELYRA—from raw external satellite swath and hazard feed ingestion to automated spatial enrichment, priority scoring, human adjudication, field verification, and after-action outcome reporting.

\`\`\`mermaid
flowchart TD
    subgraph ExternalSources["1. Multi-Source Raw Feeds"]
        E1[Copernicus CDSE STAC<br/>Sentinel-1 SAR / Sentinel-2]
        E2[USGS Earthquakes API<br/>GeoJSON Feed M ≥ 4.0]
        E3[GDACS Alerts<br/>Multi-Hazard RSS & GeoJSON]
        E4[SACHET NDMA<br/>India CAP XML Feeds]
        E5[NASA FIRMS<br/>VIIRS Active Fire CSV]
        E6[OpenStreetMap<br/>Overpass QL Infrastructure]
    end

    subgraph Normalization["2. Ingestion & Normalization Layer"]
        N1[IngestionEngine Workers]
        N2[Schema Normalizer & Validator]
        N3[Spatial Bounding Box Clipper]
    end

    subgraph Datastore["3. Relational Datastore (PostgreSQL)"]
        D1[(disaster_events / weather_alerts)]
        D2[(incidents & AOI Polygons)]
        D3[(osm_critical_assets)]
        D4[(imagery_assets & imagery_pairs)]
        D5[(detections & ai_decision_logs)]
        D6[(cases status=DETECTED)]
        D7[(tasks status=ASSIGNED)]
        D8[(field_observations)]
        D9[(outcomes & audit_events)]
    end

    subgraph AnalyticsAI["4. AI & Priority Computation"]
        A1[Multimodal AI Vision Provider]
        A2[5-Factor Priority Scoring Engine]
    end

    subgraph HumanOps["5. Human Operations & Field Execution"]
        H1[Duty Officer Triage Modal]
        H2[Incident Commander Tasking]
        H3[Field Responder Offline PWA]
        H4[Executive Analytics Dashboard]
    end

    E1 & E2 & E3 & E4 & E5 --> N1
    N1 --> N2 --> N3
    N3 --> D1 & D2
    D2 --> E6 --> D3

    D4 & D3 --> A1 --> D5
    D5 & D3 --> A2 --> D6

    D6 --> H1 --> D6
    D6 --> H2 --> D7
    D7 --> H3 --> D8
    D8 --> H2 --> D9
    D9 --> H4
\`\`\`

---

## Data Transformation Pipeline

1. **Ingestion & Deduplication**: External APIs are polled at defined intervals (5m for USGS, 10m for Weather, 15m for GDACS/FIRMS). Records are deduplicated by \`externalId\` to prevent duplicate incident creation.
2. **Spatial Intersection**: Ingested AOI bounding boxes query OpenStreetMap Overpass for critical nodes within a 5km radius.
3. **Multimodal Analysis**: Paired before/after satellite swaths generate structured detections with damage classification and confidence metrics.
4. **Priority Scoring**: Features are normalized to standard scales ($0\text{--}100$) and weighted to yield an integer priority score.
5. **Transactional Lineage**: Every operational record maintains foreign keys back to its originating detection, imagery asset, and external event ID, ensuring full audit traceability.
`);

  // 03-architecture/05-frontend-architecture.md
  writeFile(docsDir, '03-architecture/05-frontend-architecture.md', `---
id: frontend-architecture
title: Frontend Architecture & Provider Tree
sidebar_label: Frontend Architecture
sidebar_position: 5
---

# Frontend Architecture & Provider Tree

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend is a high-performance Single Page Application (SPA) built with React 19, Vite 7, Tailwind CSS v4, Wouter routing, and TanStack Query v5.

\`\`\`mermaid
flowchart TD
    subgraph Bootstrap["Application Bootstrap (main.tsx)"]
        ROOT[createRoot #root]
        ERR_ROOT[ErrorBoundary]
        APP[App Component]
        SW[Service Worker Registration /sw.js]
    end

    subgraph Providers["Provider Hierarchy (App.tsx)"]
        P1[QueryClientProvider client=queryClient]
        P2[TooltipProvider]
        P3[AuthProvider /api/auth/me]
        P4[WouterRouter base=BASE_URL]
        SHELL[Shell Layout Component]
        ROUTER[Wouter Switch Router]
        TOAST[Toaster & AlertBanner]
    end

    subgraph ShellComp["Shell Layout (App.tsx:174)"]
        SIDEBAR[Sidebar Navigation]
        HEADER[Operational Header & Incident Switcher]
        INDICATOR[LiveFeedIndicator SSE/WS]
        BANNER[Active Weather Alerts Banner]
        MAIN[Main Tactical Content Outlet]
    end

    ROOT --> ERR_ROOT --> APP
    APP --> P1 --> P2 --> P3 --> P4 --> SHELL
    SHELL --> SIDEBAR & HEADER & BANNER & MAIN
    HEADER --> INDICATOR
    MAIN --> ROUTER
    APP --> TOAST
    ROOT --> SW
\`\`\`

---

## Component & State Architecture

### 1. Provider Tree Ordering
1. **\`QueryClientProvider\`**: Configures TanStack Query server caching with standardized query keys.
2. **\`TooltipProvider\`**: Radix UI tooltip context for accessible operational hints.
3. **\`AuthProvider\`**: Deserializes session user via \`GET /api/auth/me\`. Enforces login redirection on 401.
4. **\`WouterRouter\`**: Lightweight client-side router matching 15 discrete application routes.
5. **\`<Shell>\`**: Enforces authentication guards, renders responsive sidebar/topbar navigation, and listens to real-time events via \`useLiveEvents()\`.

### 2. Styling System
- **Tailwind CSS v4**: Modular utility-first design utilizing CSS variables for theme tokens (e.g., \`bg-sidebar\`, \`border-border\`, \`text-primary\`).
- **Tactical Dark Palette**: High-contrast, dark-mode optimized colors designed for low-fatigue 24/7 EOC operations.
`);

  // 03-architecture/06-backend-architecture.md
  writeFile(docsDir, '03-architecture/06-backend-architecture.md', `---
id: backend-architecture
title: Backend Architecture & Service Organization
sidebar_label: Backend Architecture
sidebar_position: 6
---

# Backend Architecture & Service Organization

<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend is an Express 5 application organized as a modular monolith. It separates HTTP routing, middleware validation, domain services, database models, and real-time gateways into clean, decoupled modules.

\`\`\`mermaid
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
\`\`\`

---

## Source Directory Organization

- \`artifacts/api-server/src/app.ts\`: Express application factory and middleware configuration.
- \`artifacts/api-server/src/index.ts\`: HTTP and WebSocket server bootstrap on port 3000.
- \`artifacts/api-server/src/routes/\`: 18 modular Express route files handling specific API resources.
- \`artifacts/api-server/src/services/\`: Business logic, state machines, and background ingestion engines.
- \`artifacts/api-server/src/ai/\`: Multimodal AI providers, prompt templates, and schema validators.
- \`artifacts/api-server/src/realtime/\`: WebSocket gateway, connection registry, and transactional outbox.
- \`lib/db/\`: Drizzle ORM schema, migration scripts, and database connection pooling.
`);

  // 03-architecture/07-database-architecture.md
  writeFile(docsDir, '03-architecture/07-database-architecture.md', `---
id: database-architecture
title: Database Architecture & Persistence
sidebar_label: Database Architecture
sidebar_position: 7
---

# Database Architecture & Persistence

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes PostgreSQL 15 as its authoritative relational datastore, managed via TypeScript-native Drizzle ORM schemas.

\`\`\`mermaid
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
\`\`\`

---

## Schema Design Principles

1. **Structured JSONB for Geometries**: All spatial geometries (AOI polygons, asset points, detection bounds) are stored as GeoJSON in \`jsonb\` columns, providing flexible spatial operations without requiring external spatial database extensions.
2. **Monotonic Versioning**: Tables subject to concurrent operations (\`cases\`, \`tasks\`, \`field_observations\`) include a \`version\` integer column for Optimistic Concurrency Control.
3. **Immutable Audit Trails**: Status changes and operational decisions are recorded in append-only tables (\`case_status_history\`, \`audit_events\`, \`ai_decision_logs\`).
4. **Session Persistence**: Express sessions are stored directly in PostgreSQL via \`connect-pg-simple\`, enabling horizontal scaling across API server instances.
`);

  // 03-architecture/08-ai-architecture.md
  writeFile(docsDir, '03-architecture/08-ai-architecture.md', `---
id: ai-architecture
title: AI / ML Intelligence Pipeline Architecture
sidebar_label: AI Architecture
sidebar_position: 8
---

# AI / ML Intelligence Pipeline Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a dual-provider AI architecture designed to support real multimodal computer vision assessment when cloud API credentials are configured, while providing a fully deterministic baseline vision engine for air-gapped, offline, and scenario training environments.

\`\`\`mermaid
flowchart TD
    subgraph Input["Input Data"]
        IMG_BEFORE[Pre-Disaster Baseline Imagery]
        IMG_AFTER[Post-Disaster Target Imagery]
        ASSET_CTX[Critical Asset Context & Exposure]
        INC_CTX[Incident Hazard & Weather Context]
    end

    subgraph Factory["AIProviderFactory (src/ai/AIProviderFactory.ts)"]
        CHECK{GEMINI_API_KEY Configured?}
        P_GEMINI[GeminiMultimodalProvider<br/>Google Gemini 2.5 Flash]
        P_MOCK[MockVisionAssessmentProvider<br/>Baseline Vision Engine v2.4]
    end

    subgraph Prompting["Prompt Template & Security Layer"]
        SANITIZE[InputSanitizer: Prompt Injection Shield]
        PROMPT_CAT[Prompt Catalog: damage_assessment_v1]
    end

    subgraph Execution["Model Execution & Schema Validation"]
        LLM[generateContent responseMimeType=application/json]
        ZOD[Zod Schema Validator: DamageAssessmentOutputSchema]
    end

    subgraph Logging["Cryptographic Audit & Caching"]
        CACHE[AICacheService: SHA-256 Input Hash]
        LOGS[(PostgreSQL: ai_decision_logs & detections)]
    end

    IMG_BEFORE & IMG_AFTER & ASSET_CTX & INC_CTX --> SANITIZE
    SANITIZE --> PROMPT_CAT --> CHECK
    CHECK -->|Yes| P_GEMINI
    CHECK -->|No| P_MOCK
    P_GEMINI & P_MOCK --> LLM --> ZOD
    ZOD --> CACHE --> LOGS
\`\`\`

---

## Dual Provider Strategy

| Provider Feature | \`GeminiMultimodalProvider\` | \`MockVisionAssessmentProvider\` |
| :--- | :--- | :--- |
| **Model Engine** | Google Gemini 2.5 Flash (\`@google/genai\`) | \`draxelyra-cv-baseline-v2\` (Deterministic CV Engine) |
| **Inference Mode** | Real Vision-Language Model (VLM) Reasoning | Synthetic SAR Backscatter & Optical Index Simulator |
| **Prerequisites** | Valid \`GEMINI_API_KEY\` | None (Runs offline with zero configuration) |
| **Output Format** | Validated JSON conforming to Zod Schema | Validated JSON conforming to Zod Schema |
| **Token Tracking** | Captures Prompt, Completion, and Total Tokens | Emits zero-token telemetry |
| **Latency** | $800\text{--}2500\text{ ms}$ (Network dependent) | $20\text{--}50\text{ ms}$ (Local execution) |
`);

  // ===========================================================================
  // 04-frontend
  // ===========================================================================

  // 04-frontend/01-architecture.md
  writeFile(docsDir, '04-frontend/01-architecture.md', `---
id: architecture
title: Frontend Application Architecture & Shell
sidebar_label: Application Architecture
sidebar_position: 1
---

# Frontend Application Architecture & Shell

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend application is located in \`artifacts/draxelyra/\`. It is a modern React 19 Single Page Application configured with Vite 7, Tailwind CSS v4, Wouter routing, and TanStack Query caching.

---

## Application Entry Point

**Source File**: [\`artifacts/draxelyra/src/main.tsx\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/main.tsx)

\`\`\`tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import './index.css';

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error('Uncaught React UI error:', error, errorInfo);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
\`\`\`

---

## Global Provider Hierarchy

**Source File**: [\`artifacts/draxelyra/src/App.tsx:2100\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/App.tsx#L2100-L2134)

\`\`\`tsx
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\\/$/, '')}>
              <Shell>
                <Router />
              </Shell>
              <Toaster />
            </WouterRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
\`\`\`

---

## Shell Component Features (\`Shell\` in \`App.tsx\`)

1. **Authentication Guard**: Interrogates \`useAuth()\`. If \`loading\`, renders a full-screen loading skeleton. If \`!user\`, redirects to \`/login\`.
2. **Real-time Event Listener**: Activates \`useLiveEvents()\` on mount, establishing WebSocket (\`/ws\`) connectivity and cache invalidations.
3. **Active Operation Banner**: Displays the active incident ID, severity pulse dot, and start timestamp.
4. **Real Data Mode Indicator**: Highlights live data ingestion status.
5. **Weather Alert Banner**: Fetches active weather warnings from \`GET /api/weather/alerts\` and displays a dismissible warning bar.
`);

  // 04-frontend/02-pages.md
  writeFile(docsDir, '04-frontend/02-pages.md', `---
id: pages
title: Frontend Page-by-Page Technical Reference
sidebar_label: Pages Reference
sidebar_position: 2
---

# Frontend Page-by-Page Technical Reference

<span className="badge-implemented">Implemented</span>

DRAXELYRA routes are managed via Wouter inside \`artifacts/draxelyra/src/App.tsx\`. Every route is documented below with its component, permissions, data hooks, and mutation actions.

---

## Complete Routing Matrix

| Route | Component Name | Required Roles | Primary TanStack Query Keys | Mutations Executed |
| :--- | :--- | :--- | :--- | :--- |
| \`/\` | \`CommandCenter\` | All Authenticated | \`['command-summary']\`, \`['incidents']\` | Sync Live Feeds (\`POST /api/demo/load-live\`) |
| \`/login\` | \`Login\` | Public (No Auth) | None | \`login()\` (\`POST /api/auth/login\`) |
| \`/incidents\` | \`Incidents\` | All Authenticated | \`['incidents']\` | Create Incident |
| \`/incidents/:id\` | \`IncidentDetail\` | All Authenticated | \`['incident', id]\`, \`['cases', id]\` | Update Incident Status |
| \`/imagery/search\` | \`ImagerySearchPage\` | GIS Analyst, Commander | \`['imagery-catalog']\` | STAC Search (\`POST /api/imagery/search\`) |
| \`/assessment\` | \`Assessment\` | GIS Analyst, Duty Officer | \`['incident-map', id]\`, \`['cases']\` | Layer Toggles, Centroid Pan |
| \`/cases\` | \`Cases\` | All Authenticated | \`['cases']\`, \`['command-summary']\` | Filter & Sort State |
| \`/cases/:id\` | \`CaseDetail\` | Duty Officer, Commander | \`['case', id]\`, \`['audit', id]\` | Adjudicate (\`POST /api/cases/:id/review\`) |
| \`/tasks\` | \`Tasks\` | Field Lead, Commander | \`['tasks']\`, \`['cases']\` | Transition (\`PATCH /api/tasks/:id\`) |
| \`/tasks/:id\` | \`TaskDetail\` | Field Lead, Responder | \`['task', id]\` | Verify Task (\`POST /api/tasks/:id/verify\`) |
| \`/field\` | \`Field\` | Field Responder, Lead | \`['offline-queue']\` (IndexedDB) | Queue Observation (\`queueRequest\`) |
| \`/data-sources\` | \`DataSourcesPage\` | System Admin, Commander | \`['data-sources']\`, \`['feeds']\` | Trigger Sync (\`POST /api/integrations/sync\`) |
| \`/analytics\` | \`Analytics\` | Incident Commander | \`['analytics']\`, \`['metrics']\` | Generate Report (\`POST /api/ai/report\`) |
| \`/demo\` | \`Demo\` | All Authenticated | None | Load Demo (\`POST /api/demo/load\`), Reset |
| \`/settings\` | \`Settings\` | System Admin | \`['users']\`, \`['settings']\` | Toggle Integrations, User Management |
| \`*\` | \`NotFound\` | Public | None | None |
`);

  // 04-frontend/03-components.md
  writeFile(docsDir, '04-frontend/03-components.md', `---
id: components
title: Component Hierarchy & UI Design System
sidebar_label: Component Hierarchy
sidebar_position: 3
---

# Component Hierarchy & UI Design System

<span className="badge-implemented">Implemented</span>

The frontend utilizes a component hierarchy separating core domain widgets from low-level Radix UI primitives.

---

## Core Domain Components

### 1. \`IncidentMap\` (\`src/components/map/IncidentMap.tsx\`)
- **Map Engine**: MapLibre GL wrapped with \`react-map-gl/maplibre\`.
- **Basemap Layers**: Carto Dark Matter vector tiles with fallback to ArcGIS World Imagery raster tiles (\`server.arcgisonline.com\`).
- **GeoJSON Layers**:
  - \`aoi-boundary\`: Incident operational extent polygon.
  - \`critical-assets\`: Vector points styled by facility type (Hospitals in Red, Substations in Blue).
  - \`detections-heatmap\`: Density layer rendering flood/damage anomaly clusters.
  - \`fire-hotspots\`: NASA FIRMS VIIRS active thermal coordinates.

### 2. \`AIAssessmentPanel\` (\`src/components/ai/AIAssessmentPanel.tsx\`)
- Renders structured multimodal change assessment outputs.
- Displays observed changes, infrastructure impacts, uncertainty caveats, and model token usage.

### 3. \`AIAnalyticsDashboard\` (\`src/components/ai/AIAnalyticsDashboard.tsx\`)
- Renders operational funnel graphs, human vs AI agreement matrices, and false positive ratios.

### 4. \`LineageGraph\` (\`src/components/LineageGraph.tsx\`)
- Visualizes the end-to-end cryptographic data lineage from external satellite product to field-verified outcome.

### 5. \`LiveFeedIndicator\` (\`src/components/LiveFeedIndicator.tsx\`)
- Header indicator displaying real-time WebSocket connection state (\`LIVE\`, \`RECONNECTING\`, \`OFFLINE\`) and ping latency.
`);

  // 04-frontend/04-state-management.md
  writeFile(docsDir, '04-frontend/04-state-management.md', `---
id: state-management
title: State Management & TanStack Query Cache
sidebar_label: State Management
sidebar_position: 4
---

# State Management & TanStack Query Cache

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a clean separation between **Server State** (managed via TanStack Query v5) and **Local UI State** (managed via React hooks).

---

## Server State & Query Keys

TanStack Query manages all remote API data. Standardized query keys enable precise, surgical cache invalidations:

| Entity | Primary Query Key | Invalidation Trigger |
| :--- | :--- | :--- |
| **Command Summary** | \`['command-summary', incidentId?]\` | Realtime event \`CASE_CREATED\`, \`TASK_ASSIGNED\`, or 30s interval |
| **Incidents List** | \`['incidents']\` | Realtime event \`INCIDENT_CREATED\`, \`INCIDENT_UPDATED\` |
| **Single Incident** | \`['incident', incidentId]\` | Incident status change |
| **Cases Queue** | \`['cases']\`, \`['/api/cases']\` | \`CASE_CONFIRMED\`, \`CASE_REJECTED\`, \`CASE_TASKED\` |
| **Single Case** | \`['case', caseId]\` | Review submission or OCC conflict refresh |
| **Tasks Board** | \`['tasks']\`, \`['/api/tasks']\` | \`TASK_ASSIGNED\`, \`TASK_VERIFIED\`, \`TASK_COMPLETED\` |
| **Incident Map** | \`['incident-map', incidentId]\` | Any case status transition within the active AOI |
| **Audit Activity** | \`['audit-timeline']\`, \`['audit', caseId]\` | Any domain mutation emitting \`AUDIT_EVENT_CREATED\` |

---

## Cache Invalidation Strategy

When the WebSocket gateway receives a domain event, the \`useLiveEvents()\` hook executes targeted query invalidations:

\`\`\`typescript
switch (event.entityType) {
  case 'CASE':
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['command-summary'] });
    queryClient.invalidateQueries({ queryKey: ['incident-map'] });
    if (event.entityId) {
      queryClient.invalidateQueries({ queryKey: ['case', event.entityId] });
    }
    break;
  case 'TASK':
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['command-summary'] });
    break;
}
\`\`\`
`);

  // 04-frontend/05-forms-validation.md
  writeFile(docsDir, '04-frontend/05-forms-validation.md', `---
id: forms-validation
title: Forms & Adjudication Controls
sidebar_label: Forms & Validation
sidebar_position: 5
---

# Forms & Adjudication Controls

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces rigorous input validation across all operational forms to prevent corrupted state and malformed coordinates.

---

## 1. Case Adjudication Form (\`/cases/:id\`)
- **Required Fields**:
  - \`decision\`: Choice of \`"CONFIRMED"\`, \`"REJECTED"\`, or \`"UNCERTAIN"\`.
  - \`notes\`: Minimum 10 characters explaining operational reasoning.
  - \`expectedVersion\`: Read-only integer ensuring OCC validation.
- **Client Validation**: Disables submit button until notes meet length criteria and decision is selected.

## 2. Field Observation Form (\`/field\`)
- **Required Fields**:
  - \`verificationStatus\`: \`"CONFIRMED_DAMAGED"\`, \`"NO_DAMAGE_FOUND"\`, or \`"INACCESSIBLE"\`.
  - \`location\`: Latitude/Longitude populated via browser Geolocation API.
  - \`media\`: Optional photo file with magic-byte validation.
- **Offline Behavior**: Intercepts submit event, serializes payload to IndexedDB \`syncQueue\`, and renders a "Pending Sync" badge.
`);

  // 04-frontend/06-error-handling-resilience.md
  writeFile(docsDir, '04-frontend/06-error-handling-resilience.md', `---
id: error-handling-resilience
title: Frontend Error Handling & UI Resilience
sidebar_label: Error Handling & Resilience
sidebar_position: 6
---

# Frontend Error Handling & UI Resilience

<span className="badge-implemented">Implemented</span>

The frontend provides multiple defensive layers to isolate component crashes, handle API outages, and recover from concurrency conflicts.

---

## Error Boundaries

**Source File**: [\`artifacts/draxelyra/src/components/error-boundary.tsx\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/components/error-boundary.tsx)

1. **Root Error Boundary**: Wraps the entire application. Catches uncaught render crashes and provides a "Reload Operating System" recovery screen.
2. **Map Error Boundary**: Wraps \`IncidentMap\`. If MapLibre WebGL context fails (e.g., hardware acceleration disabled), renders a fallback vector list without crashing the command dashboard.

---

## Concurrency Conflict Handling (HTTP 409)

When an operator submits a case review for a stale version:
1. The API responds with HTTP 409 \`VERSION_CONFLICT\`.
2. The UI intercepts the error, displays an amber toast alert (*"Record was updated by another operator"*), and automatically refetches the latest server record.
`);

  // ===========================================================================
  // 05-backend
  // ===========================================================================

  // 05-backend/01-architecture.md
  writeFile(docsDir, '05-backend/01-architecture.md', `---
id: architecture
title: Backend Application Bootstrap & Lifecycle
sidebar_label: Backend Architecture
sidebar_position: 1
---

# Backend Application Bootstrap & Lifecycle

<span className="badge-implemented">Implemented</span>

The backend API server is located in \`artifacts/api-server/\`. It is built with Express 5, Node.js 20+, and PostgreSQL 15 via Drizzle ORM.

---

## Server Bootstrap Sequence

**Source File**: [\`artifacts/api-server/src/index.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/index.ts)

1. **Load Environment**: Initializes \`dotenv\` reading \`.env\`.
2. **Instantiate HTTP Server**: Creates Node \`http.createServer(app)\`.
3. **Initialize WebSocket Gateway**: Attaches \`realtimeGateway.initialize(server, sessionSecret)\` to the HTTP server for \`/ws\` upgrade requests.
4. **Start Background Ingestion**: Calls \`ingestionEngine.start()\` to initiate background cron workers for USGS, GDACS, and SACHET alerts.
5. **Start Outbox Dispatcher**: Launches the transactional outbox polling worker.
6. **Listen on Port**: Binds to \`process.env.PORT || 3000\`.
`);

  // 05-backend/02-services.md
  writeFile(docsDir, '05-backend/02-services.md', `---
id: services
title: Backend Domain Services
sidebar_label: Domain Services
sidebar_position: 2
---

# Backend Domain Services

<span className="badge-implemented">Implemented</span>

Domain services in \`artifacts/api-server/src/services/\` encapsulate core business logic, finite state transitions, and background ingestion tasks.

---

## Service Catalog

| Service Name | Source File | Core Responsibilities |
| :--- | :--- | :--- |
| **Case State Machine** | \`case-state-machine.ts\` | Manages \`cases\` lifecycle, validates allowed transitions, increments OCC versions, logs status history, and writes outbox events. |
| **Task State Machine** | \`task-state-machine.ts\` | Manages \`tasks\` lifecycle, computes dynamic priority SLAs, and records task audit trails. |
| **Ingestion Engine** | \`ingestion-engine.ts\` | Cron scheduler polling USGS Earthquakes, GDACS Multi-hazard, SACHET NDMA, and NASA FIRMS fire hotspots. |
| **Damage Assessment** | \`damage-assessment.ts\` | Orchestrates AI multimodal damage assessment, prompt construction, and Zod output schema validation. |
| **Asset Enrichment** | \`asset-enrichment.ts\` | Intersects incident AOIs with OpenStreetMap infrastructure to create operational cases. |
| **OSM Sync** | \`osm-sync.ts\` | Executes Overpass QL queries to extract hospitals, schools, bridges, and emergency shelters. |
| **Job Runner** | \`job-runner.ts\` | Asynchronous queue processing satellite discovery, downloads, and change-detection tasks. |
`);

  // 05-backend/03-middleware.md
  writeFile(docsDir, '05-backend/03-middleware.md', `---
id: middleware
title: Backend Middleware Stack & RBAC
sidebar_label: Middleware Stack
sidebar_position: 3
---

# Backend Middleware Stack & RBAC

<span className="badge-implemented">Implemented</span>

The backend implements a modular middleware pipeline enforcing security, session management, authorization, and structured JSON logging.

---

## Middleware Execution Pipeline

\`\`\`mermaid
flowchart LR
    REQ[HTTP Request] --> PINO[Pino Request Logger]
    PINO --> CORS[CORS Header Middleware]
    CORS --> COOKIE[Cookie Parser]
    COOKIE --> SESS[connect-pg-simple Session]
    SESS --> AUTH[requireAuth Guard]
    AUTH --> RBAC[requireRole Guard]
    RBAC --> HANDLER[API Route Controller]
    HANDLER --> ERR[Global Error Handler]
\`\`\`

---

## Authentication & RBAC Guards

**Source File**: [\`artifacts/api-server/src/middlewares/auth.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/middlewares/auth.ts)

- **\`requireAuth\`**: Verifies \`req.session.userId\` exists. If missing, responds with HTTP 401 \`UNAUTHORIZED\`.
- **\`requireRole(...roles: string[])\`**: Verifies \`req.session.role\` matches permitted roles. If insufficient, responds with HTTP 403 \`FORBIDDEN\`.
`);

  // 05-backend/04-error-handling.md
  writeFile(docsDir, '05-backend/04-error-handling.md', `---
id: error-handling
title: Backend Error Handling & HTTP Envelopes
sidebar_label: Error Handling
sidebar_position: 4
---

# Backend Error Handling & HTTP Envelopes

<span className="badge-implemented">Implemented</span>

The API server emits standardized JSON error payloads conforming to a unified structure across all endpoints.

---

## Error Envelope Specification

\`\`\`json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The record changed on the server.",
    "serverVersion": 3,
    "serverRecord": { "id": "C-1048", "status": "CONFIRMED", "version": 3 }
  }
}
\`\`\`

---

## Standard Error Codes

| HTTP Status | Error Code | Trigger Condition |
| :--- | :--- | :--- |
| **400** | \`BAD_REQUEST\` | Missing required parameters or malformed JSON payload. |
| **401** | \`UNAUTHORIZED\` | Missing or expired session cookie. |
| **403** | \`FORBIDDEN\` | User role lacks sufficient permissions for the endpoint. |
| **404** | \`NOT_FOUND\` | Requested incident, case, task, or evidence record does not exist. |
| **409** | \`VERSION_CONFLICT\` | Optimistic concurrency conflict (\`expectedVersion !== record.version\`). |
| **422** | \`INVALID_TRANSITION\` | Requested FSM state transition is disallowed by domain rules. |
| **500** | \`SERVER_ERROR\` | Internal database or unhandled server exception. |
`);

  // 05-backend/05-jobs-processing.md
  writeFile(docsDir, '05-backend/05-jobs-processing.md', `---
id: jobs-processing
title: Asynchronous Processing Jobs Engine
sidebar_label: Processing Jobs
sidebar_position: 5
---

# Asynchronous Processing Jobs Engine

<span className="badge-implemented">Implemented</span>

Heavy computational operations—including satellite catalog discovery, raster swath download, change detection, and thumbnail generation—are executed asynchronously via the \`processing_jobs\` table and \`JobRunner\` service.

---

## Processing Job Lifecycle

\`\`\`mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> RUNNING : Worker Acquires Job
    RUNNING --> SUCCEEDED : Processing Completed
    RUNNING --> FAILED : Error / Timeout (Attempts < Max)
    FAILED --> QUEUED : Exponential Retry
    RUNNING --> CANCELLED : Operator Aborts Job
    SUCCEEDED --> [*]
\`\`\`

---

## Job Types

- **\`DISCOVERY\`**: Queries external STAC APIs (Copernicus CDSE) for available Sentinel passes over an AOI.
- **\`DOWNLOAD\`**: Fetches optical/SAR products and stages them in local storage.
- **\`PREPROCESS\`**: Generates ortho-rectified GeoTIFFs and tile pyramids.
- **\`CHANGE_DETECTION\`**: Executes spectral difference or radar coherence analysis between paired swaths.
- **\`THUMBNAIL\`**: Extracts visual web preview crops for command center cards.
`);

  console.log('03-architecture, 04-frontend, and 05-backend generated successfully.');
}
