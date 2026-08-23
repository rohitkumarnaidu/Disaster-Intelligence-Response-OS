import fs from 'fs';
import path from 'path';

export function generateArch(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 03-architecture/system-architecture.md
  write('03-architecture/system-architecture.md', `---
id: system-architecture
title: System Architecture
sidebar_position: 1
---

# System Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA is architected as an **OpenAPI-first, multi-tier disaster operations platform**. It consists of a React 19 single-page application (SPA), an Express 5 REST API gateway, a PostgreSQL 15 relational database, and an IndexedDB offline mutation buffer.

\`\`\`mermaid
graph TB
    subgraph Client Layer [Frontend Tier]
        UI[React 19 / Vite Command Console]
        Map[MapLibre GL Geospatial Engine]
        Store[TanStack React Query Cache]
        Offline[IndexedDB draxelyra-offline Queue]
    end

    subgraph API Layer [Backend Tier]
        Router[Express 5 REST Router /api]
        AuthMid[Session & RBAC Middleware]
        CaseSM[Case State Machine Service]
        TaskSM[Task State Machine Service]
        PriEng[Priority Engine Module]
        EvPipe[Evidence Validation & Storage]
        PinoLog[Pino Structured Logger]
    end

    subgraph Data Layer [Persistence Tier]
        Drizzle[Drizzle ORM]
        PG[(PostgreSQL 15)]
        Sessions[(PostgreSQL Session Store)]
        Uploads[(Disk File Storage /uploads)]
    end

    UI --> Store
    UI --> Map
    Store --> Router
    Store -.->|Network Disconnected| Offline
    Offline -.->|Network Reconnect| Router
    Router --> AuthMid
    AuthMid --> CaseSM & TaskSM & PriEng & EvPipe
    CaseSM --> Drizzle
    TaskSM --> Drizzle
    EvPipe --> Uploads
    Drizzle --> PG
    AuthMid --> Sessions
\`\`\`

---

## Workspace Structure & Packaging

The monorepo is managed with **pnpm workspaces** under the following layout:

\`\`\`
DRAXELYRA-Response-OS/
├── artifacts/
│   ├── api-server/         # Express 5 backend application
│   ├── draxelyra/          # React 19 command center web console
│   └── mockup-sandbox/     # UI component prototype sandbox
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 contract (openapi.yaml) & Orval codegen
│   ├── api-zod/            # Generated Zod validation schemas
│   ├── api-client-react/   # Generated TanStack Query React hooks & customFetch
│   └── db/                 # Drizzle ORM schema, relations & PostgreSQL client
├── docs/                   # Complete Technical Documentation Website (Docusaurus)
├── scripts/                # Utility scripts & build automation
├── docker-compose.yml      # Local PostgreSQL 15 container definition
├── pnpm-workspace.yaml     # Workspace configuration and supply chain constraints
└── package.json            # Root workspace scripts
\`\`\`

---

## Architectural Boundaries

1. **API Contract Single Source of Truth**: The OpenAPI 3.1 specification at \`lib/api-spec/openapi.yaml\` defines all data schemas, request parameters, and operation IDs. Both frontend React Query hooks (\`lib/api-client-react\`) and backend Zod schemas (\`lib/api-zod\`) are generated directly from this specification.
2. **State & Concurrency Boundary**: All entity transitions for Cases and Tasks must pass through transactional state machines (\`case-state-machine.ts\` and \`task-state-machine.ts\`) enforcing Optimistic Concurrency Control (OCC) through version checking.
3. **Session & Security Boundary**: Authentication uses HTTP-only secure cookie sessions backed by the PostgreSQL \`session\` table via \`connect-pg-simple\`.
`);

  // 03-architecture/architecture-principles.md
  write('03-architecture/architecture-principles.md', `---
id: architecture-principles
title: Architectural Principles
sidebar_position: 2
---

# Architectural Principles

The engineering of DRAXELYRA is governed by five foundational architectural principles:

### 1. Explainability Over Black-Box Automation
AI model inferences must never dictate operational actions without human interpretability. Priority scores are calculated deterministically using weighted operational factors (\`0.30*S + 0.25*C + 0.20*E + 0.15*U + 0.10*Conf\`) so duty officers can inspect exactly why an asset was ranked high.

### 2. Strict Human-in-the-Loop Triage
An AI detection is merely a *candidate signal*. It cannot transition to an assigned field task without explicit confirmation (\`CONFIRMED\`, \`REJECTED\`, or \`UNCERTAIN\`) by an authorized analyst or commander with recorded review notes.

### 3. Resilient Offline Operation
Field responders in disaster zones cannot rely on uninterrupted high-speed data. The system treats network disconnection as a standard operating state: all field observations and task updates are buffered in browser IndexedDB storage and synchronized sequentially upon reconnection.

### 4. Zero-Data-Loss Concurrency
Disaster command centers involve multiple duty officers, triage analysts, and field liaisons acting concurrently. The system employs **Optimistic Concurrency Control (OCC)** using version fields and compare-and-swap SQL updates, preventing accidental state overwrites.

### 5. Immutable Auditability
Every review decision, task status change, priority recalculation, and field upload creates an append-only \`audit_events\` record linked to the acting user, timestamp, and metadata.
`);

  // 03-architecture/request-flow.md
  write('03-architecture/request-flow.md', `---
id: request-flow
title: Request Flow
sidebar_position: 3
---

# Request Lifecycle & HTTP Pipeline

<span className="badge-implemented">Implemented</span>

Every HTTP request to the DRAXELYRA API traverses a structured pipeline of middlewares before reaching the business domain services.

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Client as React Client (customFetch)
    participant Pino as Pino HTTP Logger
    participant Cors as CORS Middleware
    participant Body as JSON / URL-encoded Parser
    participant Sess as Session Middleware (connect-pg-simple)
    participant Auth as requireAuth / requireRole
    participant Route as Express Route Handler
    participant Service as State Machine / DB Transaction

    Client->>Pino: HTTP Request (Method + Path + Headers)
    Pino->>Cors: Assign Request ID & Log Start
    Cors->>Body: Validate Origin & Credentials
    Body->>Sess: Parse Request Payload
    Sess->>Auth: Retrieve Session from PostgreSQL (sid cookie)
    alt Session Missing or Invalid
        Auth-->>Client: 401 Unauthorized
    else Insufficient Role
        Auth-->>Client: 403 Forbidden
    else Authorized
        Auth->>Route: Pass to Route Controller
        Route->>Service: Execute Business Logic within Transaction
        Service-->>Route: Return Result
        Route-->>Client: 200 OK / 201 Created (JSON Response)
    end
\`\`\`
`);

  // 03-architecture/data-flow.md
  write('03-architecture/data-flow.md', `---
id: data-flow
title: Data Flow
sidebar_position: 4
---

# End-to-End Data Flow

<span className="badge-implemented">Implemented</span>

DRAXELYRA manages the lifecycle of disaster data from satellite ingestion to closed response outcomes.

\`\`\`mermaid
flowchart TD
    subgraph Ingestion
        S2[Sentinel-2 / Satellite Pass] --> Det[AI Change-Detection Inference]
        Det --> DetRec[Detections Table: geometry, severity, confidence]
    end

    subgraph Scoring
        DetRec --> Match[Spatial Join with Critical Assets]
        Match --> Score[Calculate Initial Priority Score]
        Score --> CaseRec[Cases Table: status=NEEDS_REVIEW, version=1]
    end

    subgraph Triage
        CaseRec --> ReviewUI[Analyst Evidence Review Console]
        ReviewUI --> Decision{Decision}
        Decision -->|Confirmed| Conf[Status: CONFIRMED, Recalculate Priority]
        Decision -->|Rejected| Rej[Status: CLOSED, Reason: False Positive]
        Decision -->|Uncertain| Unc[Status: UNCERTAIN, Request Further Data]
    end

    subgraph Dispatch
        Conf --> TaskGen[Generate Response Task & Set SLA Timer]
        TaskGen --> FieldSync[Field Responder Mobile PWA / Offline Sync]
        FieldSync --> GroundObs[Capture Ground Observation & Photos]
        GroundObs --> Verify[Verify Ground Truth: Task Status VERIFIED]
    end

    subgraph Closure
        Verify --> AutoTrans[Case Status Auto-Transitions to FIELD_VERIFIED]
        AutoTrans --> OutcomeRec[Record Outcome & Close Case]
        OutcomeRec --> AuditStream[Immutable Audit Events Log]
    end
\`\`\`
`);

  // 03-architecture/frontend-architecture.md
  write('03-architecture/frontend-architecture.md', `---
id: frontend-architecture
title: Frontend Architecture
sidebar_position: 5
---

# Frontend Architecture

<span className="badge-implemented">Implemented</span>

The frontend application located at \`artifacts/draxelyra\` is built with **React 19**, **Vite 7**, and **Tailwind CSS v4**.

---

## Component & Module Organization

\`\`\`
artifacts/draxelyra/src/
├── App.tsx                     # Main layout shell, router, and view components
├── main.tsx                    # React DOM root entry point
├── index.css                   # Global tactical dark CSS styles & fonts
├── components/
│   ├── error-boundary.tsx      # React error boundary with retry mechanisms
│   ├── map/
│   │   └── IncidentMap.tsx     # MapLibre GL geospatial map component
│   └── ui/                     # Radix UI primitives & tactical UI widgets
├── hooks/
│   ├── use-mobile.tsx          # Mobile screen breakpoint detection hook
│   └── use-toast.ts            # Toast notification dispatch hook
├── lib/
│   ├── auth.tsx                # AuthProvider context, login/logout, session hook
│   ├── offline-sync.ts         # IndexedDB synchronization queue
│   └── utils.ts                # Tailwind class merge utility (cn)
└── pages/
    ├── login.tsx               # Tactical authentication screen
    └── not-found.tsx           # 404 handler view
\`\`\`

---

## State Management Architecture

1. **Server State**: Managed via **TanStack React Query** (\`@tanstack/react-query\`). Query keys are centrally generated via \`@workspace/api-client-react\`. Automatic background refetching is configured for real-time views (e.g., Command Summary polling at 60s intervals).
2. **Authentication State**: Managed via \`AuthProvider\` in \`lib/auth.tsx\`, exposing \`useAuth()\` with \`user\`, \`loading\`, \`login()\`, and \`logout()\`.
3. **Offline Mutation State**: Managed via \`offline-sync.ts\` using native browser **IndexedDB** (\`draxelyra-offline\` database).
`);

  // 03-architecture/backend-architecture.md
  write('03-architecture/backend-architecture.md', `---
id: backend-architecture
title: Backend Architecture
sidebar_position: 6
---

# Backend Architecture

<span className="badge-implemented">Implemented</span>

The backend service located at \`artifacts/api-server\` is an **Express 5** application in TypeScript compiled with **esbuild**.

---

## Source Directory Layout

\`\`\`
artifacts/api-server/src/
├── app.ts                          # Express application configuration & middlewares
├── index.ts                        # Server entry point (starts HTTP on port 5000)
├── lib/
│   ├── logger.ts                   # Pino structured JSON logger
│   ├── priority.ts                 # Priority calculation mathematical model
│   └── priority.test.ts            # Unit tests for canonical priority score
├── middlewares/
│   └── auth.ts                     # requireAuth & requireRole RBAC guards
├── routes/
│   ├── index.ts                    # Root API router (/api)
│   ├── health.ts                   # Healthcheck endpoint (/api/health)
│   ├── auth.ts                     # Login, logout, session user (/api/auth)
│   ├── incidents.ts                # Incidents CRUD & Map GeoJSON (/api/incidents)
│   ├── cases.ts                    # Case triage, reviews & audit (/api/cases)
│   ├── tasks.ts                    # Response tasks & SLA tracking (/api/tasks)
│   ├── evidence.ts                 # File uploads & magic-byte check (/api/evidence)
│   ├── analytics.ts                # Operational metrics & funnel (/api/analytics)
│   ├── demo.ts                     # Scenario replay endpoints (/api/demo)
│   └── demo-data.ts                # Seed dataset for Chennai Urban Flood
└── services/
    ├── case-state-machine.ts       # Case lifecycle transitions & OCC versioning
    └── task-state-machine.ts       # Task lifecycle transitions & OCC versioning
\`\`\`
`);

  // 03-architecture/database-architecture.md
  write('03-architecture/database-architecture.md', `---
id: database-architecture
title: Database Architecture
sidebar_position: 7
---

# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** as its primary relational datastore with **Drizzle ORM** (\`lib/db\`) for schema definition, migrations, and query execution.

\`\`\`mermaid
erDiagram
    USERS ||--o{ INCIDENTS : "creates"
    USERS ||--o{ CASES : "owns"
    USERS ||--o{ TASKS : "assigned_to"
    USERS ||--o{ REVIEWS : "reviews"
    USERS ||--o{ AUDIT_EVENTS : "acts_in"

    INCIDENTS ||--o{ IMAGERY_ASSETS : "contains"
    INCIDENTS ||--o{ DETECTIONS : "contains"
    INCIDENTS ||--o{ CASES : "contains"

    IMAGERY_ASSETS ||--o{ DETECTIONS : "source_for"
    CRITICAL_ASSETS ||--o{ CASES : "target_of"
    DETECTIONS ||--o{ CASES : "triggers"

    CASES ||--o{ EVIDENCE : "has"
    CASES ||--o{ REVIEWS : "has"
    CASES ||--o{ TASKS : "spawns"
    CASES ||--o{ FIELD_OBSERVATIONS : "verified_by"
    CASES ||--o{ CASE_STATUS_HISTORY : "tracks"
    CASES ||--o{ OUTCOMES : "concludes"
\`\`\`
`);

  // 03-architecture/ai-architecture.md
  write('03-architecture/ai-architecture.md', `---
id: ai-architecture
title: AI / ML Architecture
sidebar_position: 8
---

# AI / ML Architecture

<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">Live Service Planned</span>

DRAXELYRA decouples **AI inference generation** from **operational emergency triage**.

---

## Dual-Score Intelligence Model

1. **Statistical Confidence (0.0 to 1.0)**: Probability that the sensor detected actual physical change.
2. **Operational Priority (0 to 100)**: Operational urgency of dispatching human response personnel.

\`\`\`mermaid
graph LR
    A[Pre/Post Satellite Imagery] --> B[Change Detector Model v2.4.1]
    B -->|Confidence: 0.55| C[Candidate Signal]
    D[Critical Hospital GIS Layer] --> E[Criticality: 100]
    F[Census Vulnerability Data] --> G[Exposure: High / 90]
    H[Incident Declared: 28.8h ago] --> I[Urgency: 12]

    C & E & G & I --> J[Deterministic Priority Engine]
    J -->|Priority Score: 83| K[High-Priority Queue C-1048]
\`\`\`
`);

  // 04-frontend/overview.md
  write('04-frontend/overview.md', `---
id: overview
title: Frontend Overview
sidebar_position: 1
---

# Frontend Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA web console (\`artifacts/draxelyra\`) provides a high-density, low-latency tactical workspace tailored for emergency management centers and field dispatch units.
`);

  // 04-frontend/routing.md
  write('04-frontend/routing.md', `---
id: routing
title: Frontend Routing
sidebar_position: 2
---

# Frontend Routing

<span className="badge-implemented">Implemented</span>

Routing is configured via **Wouter** in \`artifacts/draxelyra/src/App.tsx\`. Protected routes require an active user session.
`);

  // 04-frontend/state-management.md
  write('04-frontend/state-management.md', `---
id: state-management
title: State Management
sidebar_position: 3
---

# State Management

<span className="badge-implemented">Implemented</span>

Server state is managed via **TanStack React Query**, authentication context via React Context, and offline mutations via **IndexedDB**.
`);

  // 04-frontend/components.md
  write('04-frontend/components.md', `---
id: components
title: Components
sidebar_position: 4
---

# UI Components & Primitives

<span className="badge-implemented">Implemented</span>

Core widgets include \`Metric\`, \`Badge\`, \`IncidentMap\`, \`AuditTimeline\`, and \`ErrorBoundary\`.
`);

  // 04-frontend/design-system.md
  write('04-frontend/design-system.md', `---
id: design-system
title: Design System
sidebar_position: 5
---

# Tactical Design System

<span className="badge-implemented">Implemented</span>

Custom dark operations-console design system with Teal (\`#259184\`), Amber (\`#efac30\`), and Red (\`#cd372f\`) status markers.
`);

  // 04-frontend/geospatial-ui.md
  write('04-frontend/geospatial-ui.md', `---
id: geospatial-ui
title: Geospatial UI
sidebar_position: 6
---

# Geospatial UI Implementation

<span className="badge-implemented">Implemented</span>

The mapping interface in \`components/map/IncidentMap.tsx\` is built on **MapLibre GL** via \`react-map-gl/maplibre\`.
`);

  // 04-frontend/responsive-design.md
  write('04-frontend/responsive-design.md', `---
id: responsive-design
title: Responsive Design
sidebar_position: 7
---

# Responsive Design & Mobile Breakpoints

<span className="badge-implemented">Implemented</span>

- Desktop (1280px+): Multi-column split operations views.
- Tablet (768px - 1279px): Collapsible sidebar and stacked grids.
- Mobile (&lt; 768px): Full-width tactical cards and compact map mode.
`);

  // 04-frontend/accessibility.md
  write('04-frontend/accessibility.md', `---
id: accessibility
title: Accessibility
sidebar_position: 8
---

# Accessibility Standards

<span className="badge-implemented">Implemented</span>

WCAG AA contrast ratios, multi-modal status indicators, and keyboard navigation support.
`);

  // 05-backend/overview.md
  write('05-backend/overview.md', `---
id: overview
title: Backend Overview
sidebar_position: 1
---

# Backend Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend (\`artifacts/api-server\`) is an Express 5 TypeScript service with Drizzle ORM and PostgreSQL session storage.
`);

  // 05-backend/api-architecture.md
  write('05-backend/api-architecture.md', `---
id: api-architecture
title: API Architecture
sidebar_position: 2
---

# API Architecture & Routing Layout

<span className="badge-implemented">Implemented</span>

Sub-routers handle \`/health\`, \`/auth\`, \`/incidents\`, \`/cases\`, \`/tasks\`, \`/evidence\`, \`/analytics\`, and \`/demo\`.
`);

  // 05-backend/middleware.md
  write('05-backend/middleware.md', `---
id: middleware
title: Middleware Pipeline
sidebar_position: 3
---

# Middleware Pipeline

<span className="badge-implemented">Implemented</span>

Pino HTTP logging, CORS credentials handling, session serialization, and \`requireAuth\` / \`requireRole\` access guards.
`);

  // 05-backend/services.md
  write('05-backend/services.md', `---
id: services
title: Domain Services
sidebar_position: 4
---

# Domain Services

<span className="badge-implemented">Implemented</span>

Case State Machine, Task State Machine, Priority Engine, and Evidence Storage services.
`);

  // 05-backend/workflows.md
  write('05-backend/workflows.md', `---
id: workflows
title: Operational Workflows
sidebar_position: 5
---

# Backend Workflows

<span className="badge-implemented">Implemented</span>

Detailed sequence flows for Case Review, Task Dispatch, and Ground Verification.
`);

  // 05-backend/error-handling.md
  write('05-backend/error-handling.md', `---
id: error-handling
title: Error Handling
sidebar_position: 6
---

# Error Handling & Standard Responses

<span className="badge-implemented">Implemented</span>

Standard JSON envelopes with error codes (\`BAD_REQUEST\`, \`UNAUTHORIZED\`, \`FORBIDDEN\`, \`NOT_FOUND\`, \`VERSION_CONFLICT\`, \`INVALID_TRANSITION\`, \`SERVER_ERROR\`).
`);

  // 05-backend/background-processing.md
  write('05-backend/background-processing.md', `---
id: background-processing
title: Background Processing
sidebar_position: 7
---

# Background Processing & Async Tasks

<span className="badge-implemented">Implemented</span> <span className="badge-planned">Worker Queue Planned</span>

Dynamic SLA calculations with roadmap plans for BullMQ / Redis background workers.
`);
}
