import fs from 'fs';
import path from 'path';

export function generateArch(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 03-architecture/system-architecture.md
  write('03-architecture/system-architecture.md', `# System Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA is architected as an **OpenAPI-first, multi-tier disaster operations platform**. It consists of a React 19 single-page application (SPA), an Express 5 REST API gateway, a PostgreSQL 15 relational database, and an IndexedDB offline mutation buffer.

\`\`\`mermaid
graph TB
    subgraph Client Layer [Frontend Tier - artifacts/draxelyra]
        UI[React 19 / Vite Command Console]
        Map[MapLibre GL Geospatial Engine]
        Store[TanStack React Query Cache]
        Offline[IndexedDB draxelyra-offline Queue]
    end

    subgraph API Layer [Backend Tier - artifacts/api-server]
        Router[Express 5 REST Router /api]
        AuthMid[Session & RBAC Middleware]
        CaseSM[Case State Machine Service]
        TaskSM[Task State Machine Service]
        PriEng[Priority Engine Module]
        EvPipe[Evidence Validation & Storage]
        PinoLog[Pino Structured Logger]
    end

    subgraph Data Layer [Persistence Tier - lib/db]
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

## Monorepo Layout & Packaging Structure

The codebase is organized as a unified TypeScript monorepo managed via **pnpm workspaces**:

\`\`\`
DRAXELYRA-Response-OS/
├── artifacts/
│   ├── api-server/         # Express 5 backend REST API
│   │   ├── src/
│   │   │   ├── app.ts                  # Express application bootstrap & middleware chain
│   │   │   ├── index.ts                # Server entry point (starts listener on PORT)
│   │   │   ├── lib/                    # Logger & Priority calculation formula
│   │   │   ├── middlewares/            # Session, Auth, and RBAC guards
│   │   │   ├── routes/                 # REST Route controllers (/auth, /incidents, /cases, /tasks, etc.)
│   │   │   └── services/               # Transactional State Machines (Case, Task)
│   │   └── build.mjs                   # esbuild bundle configuration
│   ├── draxelyra/          # React 19 tactical command center
│   │   ├── src/
│   │   │   ├── App.tsx                 # Main layout, Wouter routing, view components
│   │   │   ├── main.tsx                # DOM mount & QueryClientProvider setup
│   │   │   ├── components/map/         # MapLibre GL map component & GeoJSON layers
│   │   │   ├── lib/auth.tsx            # AuthProvider & useAuth hook
│   │   │   └── lib/offline-sync.ts     # IndexedDB mutation queue & event bus
│   │   └── vite.config.ts              # Vite 7 build configuration
│   └── mockup-sandbox/     # UI component preview harness
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 contract (openapi.yaml) & Orval codegen
│   ├── api-zod/            # Generated Zod validation models
│   ├── api-client-react/   # Generated TanStack Query React hooks & customFetch
│   └── db/                 # Drizzle ORM schema, relations & PostgreSQL client
├── docs/                   # 19-Section Technical Documentation Suite
├── docker-compose.yml      # Local PostgreSQL 15 container definition
├── pnpm-workspace.yaml     # Workspace configuration and supply chain constraints
└── package.json            # Root workspace scripts
\`\`\`

---

## Core Architectural Boundaries

1. **API Contract as Single Source of Truth**: The OpenAPI 3.1 specification at \`lib/api-spec/openapi.yaml\` governs all endpoints, data types, and parameters. Frontend React Query hooks (\`lib/api-client-react\`) and backend Zod schemas (\`lib/api-zod\`) are compiled directly from this specification.
2. **State & Concurrency Boundary**: All state mutations for operational Cases and Tasks must execute through transactional finite state machines (\`case-state-machine.ts\` and \`task-state-machine.ts\`) enforcing Optimistic Concurrency Control (OCC) using version checking.
3. **Session & Security Boundary**: Authentication uses HTTP-only secure cookie sessions backed by PostgreSQL table \`session\` via \`connect-pg-simple\`, validated by granular Role-Based Access Control (RBAC) middlewares.
`);

  // 03-architecture/architecture-principles.md
  write('03-architecture/architecture-principles.md', `# Architectural Principles

DRAXELYRA's technical architecture is built on five core principles:

### 1. Explainability Over Black-Box Automation
AI model inferences must never dictate operational actions without human interpretability. Priority scores are calculated deterministically using weighted operational factors (\`0.30*S + 0.25*C + 0.20*E + 0.15*U + 0.10*K\`) so duty officers can inspect exactly why an asset was ranked high.

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
  write('03-architecture/request-flow.md', `# Request Lifecycle & HTTP Pipeline

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
  write('03-architecture/data-flow.md', `# End-to-End Data Flow

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
  write('03-architecture/frontend-architecture.md', `# Frontend Architecture

<span className="badge-implemented">Implemented</span>

The frontend application located at \`artifacts/draxelyra\` is built with **React 19**, **Vite 7**, and **Tailwind CSS v4**.

---

## 1. Runtime Entry Point (\`main.tsx\`)

The application bootstraps at \`artifacts/draxelyra/src/main.tsx\`:

\`\`\`tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds fresh cache
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
\`\`\`

---

## 2. Root Component & Layout Shell (\`App.tsx\`)

\`artifacts/draxelyra/src/App.tsx\` configures:
- **AuthProvider Context**: Wraps all child routes to ensure session validation against \`/api/auth/me\`.
- **Top Navigation Bar**: Renders branding, live operational counters, active route tabs, and user profile/logout controls.
- **Client-Side Routing**: Configured with **Wouter** (\`Switch\`, \`Route\`) for lightweight routing.

\`\`\`mermaid
graph TD
    A[main.tsx: QueryClientProvider] --> B[App.tsx: AuthProvider]
    B --> C[Tactical Layout Shell]
    C --> D[Top Navigation Bar]
    C --> E[Wouter Switch Router]
    E --> F["Overview (/)"]
    E --> G["Incidents (/incidents)"]
    E --> H["Assessment Map (/assessment)"]
    E --> I["Priority Queue (/cases)"]
    E --> J["Evidence Review (/review/:id)"]
    E --> K["Response Tasks (/tasks)"]
    E --> L["Field Inspection (/field)"]
    E --> M["Analytics (/analytics)"]
    E --> N["Demo Replay (/demo)"]
\`\`\`

---

## 3. Data Layer & Caching (\`lib/api-client-react\`)

- **Query Hooks**: Auto-generated by Orval into \`lib/api-client-react/src/index.ts\` (e.g., \`useListIncidents\`, \`useListCases\`, \`useGetCase\`, \`useListTasks\`).
- **Fetch Wrapper**: \`customFetch\` in \`lib/api-client-react/src/custom-fetch.ts\` injects \`credentials: 'include'\` and catches offline network disconnects to enqueue mutations into IndexedDB.
- **Query Invalidation**: On successful mutation (e.g. \`useReviewCase\`), the query cache invalidates \`['case', id]\` and \`['cases']\` to trigger automatic background UI updates.
`);

  // 03-architecture/backend-architecture.md
  write('03-architecture/backend-architecture.md', `# Backend Architecture

<span className="badge-implemented">Implemented</span>

The backend service at \`artifacts/api-server\` is an **Express 5** application in TypeScript compiled with **esbuild**.

---

## 1. Application Bootstrap (\`index.ts\` & \`app.ts\`)

- **\`index.ts\`**: Resolves the HTTP port (\`process.env.PORT || 5000\`) and initiates the Express listener with graceful shutdown handling.
- **\`app.ts\`**: Configures the HTTP pipeline:

\`\`\`typescript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from '@workspace/db';
import router from './routes';

const app = express();
const PgSession = connectPgSimple(session);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'draxelyra_default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use('/api', router);
export default app;
\`\`\`

---

## 2. Middleware Stack Order

1. **Pino Logger**: Assigns unique request IDs and logs structured JSON logs.
2. **CORS**: Validates incoming origin and permits session cookie headers.
3. **Body Parser**: Decodes JSON and URL-encoded payloads.
4. **Session**: Deserializes PostgreSQL session ID and binds \`req.session.userId\`.
5. **requireAuth**: Blocks unauthenticated requests with \`401 Unauthorized\`.
6. **requireRole(...roles)**: Enforces role permissions with \`403 Forbidden\`.
`);

  // 03-architecture/database-architecture.md
  write('03-architecture/database-architecture.md', `# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** managed through **Drizzle ORM** (\`lib/db\`). The schema enforces referential integrity, optimistic concurrency versioning, and immutable audit logs.

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
  write('03-architecture/ai-architecture.md', `# AI / ML Architecture

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
  write('04-frontend/overview.md', `# Frontend Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA web console (\`artifacts/draxelyra\`) provides a high-density, low-latency tactical workspace tailored for emergency operations centers and mobile field units.

---

## Key Modules

- **Navigation Shell**: Fixed top header with active counters (backlog, overdue tasks, active incidents) and user session menu.
- **Geospatial Canvas**: Hardware-accelerated MapLibre GL map supporting GeoJSON layers for incident boundaries, critical assets, and detections.
- **Evidence Review Studio**: Dual-pane pre/post satellite imagery inspector with damage classification and review rationale forms.
- **Offline Mutation Queue**: Client-side IndexedDB database buffering requests during cellular outages.
`);

  // 04-frontend/routing.md
  write('04-frontend/routing.md', `# Frontend Routing

<span className="badge-implemented">Implemented</span>

Client-side routing is configured in \`artifacts/draxelyra/src/App.tsx\` using **Wouter**.

| Route | Component / View | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| \`/\` | \`Overview\` | Executive situational awareness dashboard | Yes |
| \`/incidents\` | \`Incidents\` | Incident registry & new incident creation | Yes |
| \`/incidents/:id\` | \`IncidentDetail\` | Incident telemetry & AOI parameters | Yes |
| \`/assessment\` | \`Assessment\` | MapLibre geospatial triage console | Yes |
| \`/cases\` | \`Cases\` | Explainable priority triage queue | Yes |
| \`/cases/:id\` | \`CaseDetail\` | Detailed case factors & audit history | Yes |
| \`/review/:id\` | \`Review\` | Evidence review & decision workspace | Yes |
| \`/tasks\` | \`Tasks\` | Response task dispatch board & SLA monitor | Yes |
| \`/field\` | \`Field\` | Tactical field responder inspection console | Yes |
| \`/analytics\` | \`Analytics\` | Incident progression funnel & performance | Yes |
| \`/demo\` | \`DemoReplay\` | Scenario replay & dataset loader | Yes (Admin) |
| \`/login\` | \`LoginPage\` | Tactical authentication screen | No |
`);

  // 04-frontend/state-management.md
  write('04-frontend/state-management.md', `# State Management

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes a 3-tier state architecture:

1. **Server State**: Managed via **TanStack React Query** (\`@tanstack/react-query\`).
   - Query keys are strictly typed via \`@workspace/api-client-react\`.
   - Polling intervals: 60s for summary dashboards, instant refetch on window focus.
2. **Authentication State**: Managed via React Context in \`artifacts/draxelyra/src/lib/auth.tsx\`, exposing:
   - \`user\`: Current logged-in user object (\`id\`, \`name\`, \`email\`, \`role\`).
   - \`login(email, password)\`: Mutates session cookie.
   - \`logout()\`: Clears session and redirects to \`/login\`.
3. **Offline Queue State**: Managed via **IndexedDB** in \`artifacts/draxelyra/src/lib/offline-sync.ts\`.
`);

  // 04-frontend/components.md
  write('04-frontend/components.md', `# UI Components & Primitives

<span className="badge-implemented">Implemented</span>

The frontend utilizes a combination of Radix UI primitives and custom tactical components:

- **\`Metric\`**: Displays KPI counters with trend badges and status color accents.
- **\`Badge\`**: Renders standardized status markers (\`badge-implemented\`, \`badge-dev\`, \`badge-mock\`, \`badge-planned\`).
- **\`IncidentMap\`**: MapLibre GL wrapper component rendering GeoJSON layers with popup tooltips.
- **\`AuditTimeline\`**: Chronological visual feed of actor decisions and state mutations.
- **\`ErrorBoundary\`**: Global error wrapper catching rendering exceptions with reset buttons.
`);

  // 04-frontend/design-system.md
  write('04-frontend/design-system.md', `# Tactical Design System

<span className="badge-implemented">Implemented</span>

The UI is built with Tailwind CSS v4 and a dark operations console theme:

| Element | Color Code | Purpose |
| :--- | :--- | :--- |
| **Primary Background** | \`#0b1210\` | Dark tactical console canvas |
| **Card / Surface** | \`#14211f\` | Elevated panels and widgets |
| **Border / Divider** | \`#1c2b27\` | Subtle grid lines |
| **Teal Accent** | \`#259184\` / \`#34b3a4\` | Confirmed status, primary actions, active tabs |
| **Amber Warning** | \`#efac30\` / \`#f7ca68\` | Needs review, moderate damage, approaching SLA |
| **Red Critical** | \`#cd372f\` | Severe/Destroyed damage, overdue SLA, rejected |
`);

  // 04-frontend/geospatial-ui.md
  write('04-frontend/geospatial-ui.md', `# Geospatial UI Implementation

<span className="badge-implemented">Implemented</span>

The geospatial workspace in \`artifacts/draxelyra/src/components/map/IncidentMap.tsx\` is built on **MapLibre GL** via \`react-map-gl/maplibre\`.

- **Vector Basemap**: Carto Voyager GL style (\`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json\`).
- **Dynamic GeoJSON Sources**: Fetched via \`GET /api/incidents/:id/map\` and rendered as separate WebGL layers:
  - \`aoi-layer\`: Semi-transparent polygon fill and dashed stroke for the operational zone.
  - \`assets-layer\`: Neutral circles showing hospitals, power substations, and bridges.
  - \`detections-layer\`: Red circles indicating candidate structural change detections.
  - \`cases-layer\`: Priority-colored interactive circles with click-to-open case inspection.
`);

  // 04-frontend/responsive-design.md
  write('04-frontend/responsive-design.md', `# Responsive Design & Mobile Breakpoints

<span className="badge-implemented">Implemented</span>

- **Desktop (1280px+)**: Multi-column split views (Map + Case Queue + Detail Panel).
- **Tablet (768px - 1279px)**: Collapsible sidebar navigation and stacked grid cards.
- **Mobile (< 768px)**: Optimized for tactical field responders: full-width observation cards, touch targets (minimum 44px), and compact map view.
`);

  // 04-frontend/accessibility.md
  write('04-frontend/accessibility.md', `# Accessibility Standards

<span className="badge-implemented">Implemented</span>

- **Contrast Ratios**: WCAG AA compliance (4.5:1 text-to-background minimum).
- **Multi-Modal Indicators**: Statuses are conveyed via color, text labels, and icons (not color alone).
- **Keyboard Navigation**: Radix UI dialogs and menus support full Tab and Esc key controls.
`);

  // 05-backend/overview.md
  write('05-backend/overview.md', `# Backend Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend (\`artifacts/api-server\`) is an Express 5 TypeScript service with Drizzle ORM and PostgreSQL session storage.
`);

  // 05-backend/api-architecture.md
  write('05-backend/api-architecture.md', `# API Architecture & Routing Layout

<span className="badge-implemented">Implemented</span>

Sub-routers handle \`/health\`, \`/auth\`, \`/incidents\`, \`/cases\`, \`/tasks\`, \`/evidence\`, \`/analytics\`, and \`/demo\`.
`);

  // 05-backend/middleware.md
  write('05-backend/middleware.md', `# Middleware Pipeline

<span className="badge-implemented">Implemented</span>

Pino HTTP logging, CORS credentials handling, session serialization, and \`requireAuth\` / \`requireRole\` access guards.
`);

  // 05-backend/services.md
  write('05-backend/services.md', `# Domain Services

<span className="badge-implemented">Implemented</span>

Case State Machine, Task State Machine, Priority Engine, and Evidence Storage services.
`);

  // 05-backend/workflows.md
  write('05-backend/workflows.md', `# Operational Workflows

<span className="badge-implemented">Implemented</span>

Detailed sequence flows for Case Review, Task Dispatch, and Ground Verification.
`);

  // 05-backend/error-handling.md
  write('05-backend/error-handling.md', `# Error Handling

<span className="badge-implemented">Implemented</span>

Standard JSON envelopes with error codes (\`BAD_REQUEST\`, \`UNAUTHORIZED\`, \`FORBIDDEN\`, \`NOT_FOUND\`, \`VERSION_CONFLICT\`, \`INVALID_TRANSITION\`, \`SERVER_ERROR\`).
`);

  // 05-backend/background-processing.md
  write('05-backend/background-processing.md', `# Background Processing

<span className="badge-implemented">Implemented</span> <span className="badge-planned">Worker Queue Planned</span>

Dynamic SLA calculations with roadmap plans for BullMQ / Redis background workers.
`);
}
