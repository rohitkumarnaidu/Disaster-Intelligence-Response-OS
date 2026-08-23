import fs from 'fs';
import path from 'path';

export function generateArch(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\\n', 'utf8');
  };

  // ---------------------------------------------------------------------------
  // SECTION 03: ARCHITECTURE
  // ---------------------------------------------------------------------------

  write('03-architecture/01-system-architecture.md', `
# System Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA follows a classic modular monolith design for the backend and a Single Page Application (SPA) for the frontend, both designed to operate efficiently under constrained network environments typical of disaster scenarios.

## High-Level Architecture

\`\`\`mermaid
graph TD
    Client[Web Client / PWA] -->|HTTPS/WSS| LB[Load Balancer / Nginx]
    LB --> API[Node.js Express API]
    
    API --> DB[(PostgreSQL)]
    API --> FS[Evidence Storage / Disk]
    API --> AI[AI Analysis Engine / Models]
\`\`\`

## Key Components

1. **Frontend (React SPA)**: Built with React 18, Vite, and Wouter. Features offline-first capabilities via Service Worker and IndexedDB.
2. **Backend (Node.js/Express)**: Stateless API servers scaling horizontally, utilizing robust validation and middleware chains.
3. **Database (PostgreSQL)**: Single source of truth. Handles complex geospatial queries and transactional state machines.
4. **Storage**: Local disk for evidence uploads, with abstraction for future S3 integration.
  `.trim());

  write('03-architecture/02-architecture-principles.md', `
# Architecture Principles

<span className="badge-implemented">Implemented</span>

Our architecture is guided by the following principles to ensure resilience, maintainability, and scalability.

## 1. Offline-First Resilience
In disaster response, connectivity is a luxury. The client must remain functional offline.
- Actions are queued locally.
- Read models are cached.
- Optimistic UI updates.

## 2. Strong Typing & Validation
- **End-to-End Type Safety**: Zod schemas on the backend act as the source of truth and are shared or mirrored on the frontend.
- **Fail Fast**: Invalid payloads are rejected at the edge middleware before reaching business logic.

## 3. Optimistic Concurrency Control (OCC)
- All state transitions (Cases, Tasks) require version numbers.
- Prevents lost updates during concurrent edits by multiple field agents or commanders.
  `.trim());

  write('03-architecture/03-request-flow.md', `
# Request Flow

<span className="badge-implemented">Implemented</span>

Understanding the lifecycle of an API request is critical for debugging and extending the backend. DRAXELYRA uses a strict middleware chain to process incoming HTTP requests before they reach the route handlers.

## Standard API Request Lifecycle

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Express as Express App
    participant Auth as Auth Middleware
    participant Route as Route Handler
    participant Service as Business Service
    participant DB as PostgreSQL

    Client->>Express: POST /api/cases/123/status
    Express->>Express: pinoHttp (Logging)
    Express->>Express: cors (CORS headers)
    Express->>Express: express.json (Body parsing)
    Express->>Express: session (Cookie parsing)
    Express->>Auth: requireAuth / requireRole
    Auth-->>Express: 401 Unauthorized (if failed)
    Auth->>Route: next()
    Route->>Service: transitionCase(...)
    Service->>DB: BEGIN
    DB-->>Service: OK
    Service->>DB: UPDATE cases ... WHERE version = expected
    DB-->>Service: rowCount
    Service->>DB: COMMIT
    Service-->>Route: updated case
    Route-->>Client: 200 OK (JSON)
\`\`\`

## Middleware Chain (Actual Audit)

Source: \`artifacts/api-server/src/app.ts\`

1. **pinoHttp**: Structured JSON logging. Redacts sensitive data.
2. **cors**: Configured with \`origin: true\` and \`credentials: true\`.
3. **express.json**: Parses \`application/json\` payloads.
4. **express.urlencoded**: Parses \`application/x-www-form-urlencoded\`.
5. **express-session**: Backed by \`connect-pg-simple\`. Uses 30-day secure HTTP-only cookies.
6. **Static File Server**: Serves files from \`/uploads\`.
7. **API Router**: Mounts modular route groups at \`/api\`.
  `.trim());

  write('03-architecture/04-data-flow.md', `
# Data Flow

<span className="badge-implemented">Implemented</span>

Data in DRAXELYRA flows through distinct layers, ensuring separation of concerns and data integrity.

## Layers

1. **Presentation Layer**: React components. Fetches data via TanStack Query.
2. **Transport Layer**: RESTful JSON APIs.
3. **Service Layer**: State machines, priority engines, domain logic.
4. **Persistence Layer**: PostgreSQL tables and local file system.

Data flows downwards synchronously in the backend, but asynchronously across the network barrier. Real-time updates (planned) will use WebSocket channels for reverse flow.
  `.trim());

  write('03-architecture/05-frontend-architecture.md', `
# Frontend Architecture Overview

<span className="badge-implemented">Implemented</span>

The frontend architecture emphasizes modularity and fast iteration. We use React 18 with Vite for lightning-fast HMR and building.

## Core Pillars
- **State Management**: TanStack Query for server state. Local state is kept close to components using React \`useState\` or \`useReducer\`.
- **Routing**: \`wouter\` for minimalistic, fast routing without the bloat of larger routers.
- **Styling**: Tailwind CSS combined with Radix UI primitives for accessible, unstyled components.

(See Section 04 for deep dives).
  `.trim());

  write('03-architecture/06-backend-architecture.md', `
# Backend Architecture Overview

<span className="badge-implemented">Implemented</span>

The backend is a Node.js Express application written in TypeScript. It is designed to be stateless (except for session data stored in PG) to allow horizontal scaling.

## Core Pillars
- **Modular Routing**: Routes are grouped by domain (e.g., \`casesRouter\`, \`tasksRouter\`).
- **Service Pattern**: Business logic (state machines, scoring) is extracted from route handlers into dedicated services.
- **Unified Error Handling**: All errors funnel through a centralized error-handling middleware to ensure consistent JSON responses.

(See Section 05 for deep dives).
  `.trim());

  write('03-architecture/07-database-architecture.md', `
# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes PostgreSQL as its primary datastore.

## Schema Highlights
- **Incidents**: The root aggregate.
- **Cases**: Belong to an incident. Track priority, status, and geospatial location.
- **Tasks**: Represent actionable work. Linked to cases.
- **Audit Events**: Immutable append-only log of critical system changes.

All mutable tables include a \`version\` column to support Optimistic Concurrency Control (OCC).
  `.trim());

  write('03-architecture/08-ai-architecture.md', `
# AI Architecture

<span className="badge-planned">Planned</span>

The AI architecture will process incoming data streams (satellite imagery, drones, field reports) to automatically detect anomalies and generate draft Cases.

## Components
- **Ingestion Pipeline**: Normalizes multimodal data.
- **Inference Engine**: Runs object detection and damage assessment models.
- **Prioritization Engine**: (Currently implemented via heuristics) will be enhanced with ML-based triage models.
  `.trim());

  // ---------------------------------------------------------------------------
  // SECTION 04: FRONTEND
  // ---------------------------------------------------------------------------

  write('04-frontend/01-architecture.md', `
# Frontend Architecture

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend is a React 18 Single Page Application designed for high-stress disaster response environments. The architecture prioritizes performance, offline capability, and rapid data access.

## Entry Point

**Source:** \`artifacts/draxelyra/src/main.tsx\`

The application bootstrap sequence:
1. Creates the React 18 root via \`createRoot(document.getElementById('root')!, { onCaughtError: ... })\`
2. Mounts the root component tree: \`<ErrorBoundary><App /></ErrorBoundary>\`
3. Registers the Service Worker: Checks \`'serviceWorker' in navigator\`, and on window load registers \`/sw.js\` to enable PWA features.
4. Imports \`./index.css\` which loads Tailwind and global CSS variables.

## Provider Hierarchy

The \`App.tsx\` file establishes the global context providers, wrapping the application in the following order:

\`\`\`tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\\/$/, '')}>
        <Shell>
          <Router /> {/* Wouter Switch wrapped in RoutedErrorBoundary */}
        </Shell>
        <Toaster />
      </WouterRouter>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
\`\`\`

1. **\`QueryClientProvider\`**: Configures TanStack Query for server state caching.
2. **\`TooltipProvider\`**: Radix UI provider for accessible tooltips globally.
3. **\`AuthProvider\`**: Custom context for session management.
4. **\`WouterRouter\`**: Minimalist routing context.
5. **\`<Shell>\`**: The main layout component providing the sidebar, topbar, and acting as an auth guard.
6. **\`<Toaster />\`**: Global notification system.

## Authentication Flow

**Source:** \`src/lib/auth.tsx\`

Authentication is strictly enforced before accessing the application shell.

- **Initialization**: On mount, \`AuthProvider\` calls \`customFetch<User>('/api/auth/me')\`. 
  - If successful, sets the user in state.
  - If error (e.g., 401), sets user to null.
  - Sets \`loading = false\` to unblock the UI.
- **Login (\`login(data)\`)**: POSTs to \`/api/auth/login\`. On success, updates context and navigates to \`/\`.
- **Logout (\`logout()\`)**: POSTs to \`/api/auth/logout\`. Clears context and navigates to \`/login\`.
- **Guard**: The \`<Shell>\` component checks the auth state:
  - If \`loading\`, renders a full-screen spinner.
  - If \`!user\`, redirects immediately to \`/login\`.

## Route Definitions

All 15 routes are defined within the Wouter \`<Switch>\` inside \`App.tsx\`.

| Route | Component | Auth Required | Purpose | TanStack Query Hook | Mutations |
|-------|-----------|---------------|---------|---------------------|-----------|
| \`/\` | \`CommandCenter\` | Yes | Dashboard: 6 KPI metrics, minimap, top 4 cases, owned tasks, activity feed | \`useGetCommandSummary\` (refetch: 60s) | None |
| \`/login\` | \`Login\` | No | Email/password form, pre-filled demo credentials | None | \`login()\` (Auth) |
| \`/incidents\` | \`Incidents\` | Yes | Registry of crisis incidents | \`useListIncidents\` | None |
| \`/incidents/:id\`| \`IncidentDetail\` | Yes | Single incident: metadata, timeline, AOI minimap | \`useGetIncident(id)\` | None |
| \`/assessment\` | \`Assessment\` | Yes | Map-first triage workspace with layer toggles | \`useListCases\` | None |
| \`/cases\` | \`Cases\` | Yes | Priority queue table sorted by score/confidence | \`useListCases\` | None |
| \`/cases/:id\` | \`CaseDetail\` | Yes | Deep case view: before/after imagery, priority ledger, response card | \`useGetCase(id)\` | None |
| \`/review/:id\` | \`Review\` | Yes | Human-in-the-loop adjudication: confirm/reject/uncertain | \`useGetCase(id)\` | \`useReviewCase()\` |
| \`/tasks\` | \`Tasks\` | Yes | Kanban board: queued/in_progress/completed columns | \`useListTasks\` | \`useUpdateTask()\` |
| \`/tasks/:id\` | \`TaskDetail\` | Yes | Task inspection: assignment, SLA, verification checklist | None (fallback) | \`useUpdateTask()\` |
| \`/field\` | \`Field\` | Yes | Mobile field verification with offline sync UI | None (static) | None (local state)|
| \`/analytics\` | \`Analytics\` | Yes | KPIs, funnel chart, confidence vs priority scatter, SLA by team | None (static) | None |
| \`/demo\` | \`Demo\` | Yes | Scenario replay engine with 5-step progress | None | \`useLoadDemo()\`, \`useResetDemo()\` |
| \`/settings\` | \`Settings\` | Yes | Demo user directory, integration adapter toggles | None | None |
| \`*\` | \`NotFound\` | No | 404 page | None | None |

## TanStack Query Patterns

- **Query Keys**: Standardized as \`['entity', id?]\`. Example: \`['incident-map', incidentId]\`.
- **Refetching**: Highly dynamic data (like the \`CommandCenter\` summary) utilizes \`refetchInterval\` (60000ms).
- **Invalidation**: Mutations immediately invalidate related query keys. For instance, \`useReviewCase()\` invalidates \`['incident-map']\` to trigger a map refresh, showing the new case status color.
  `.trim());

  write('04-frontend/02-pages.md', `
# Pages & Views

<span className="badge-implemented">Implemented</span>

This document details the functionality of every major route and view within the DRAXELYRA frontend.

## Dashboard & Command

### \`CommandCenter\` (\`/\`)
The primary operational overview.
- **KPI Metrics**: Displays 6 top-level metrics (e.g., Active Incidents, Total Cases, Unassigned Tasks).
- **Minimap**: A small contextual map showing the global active areas.
- **Top 4 Cases**: A brief list of the most critical cases demanding attention.
- **Owned Tasks**: Tasks assigned to the currently logged-in user.
- **Activity Feed**: A scrolling feed of recent system events.
- **Data Fetching**: Utilizes \`useGetCommandSummary\` with a 60-second polling interval to keep commanders updated without manual refreshes.

## Incidents Management

### \`Incidents\` (\`/incidents\`)
The global registry of all crisis incidents (e.g., "Hurricane Delta", "Region 4 Earthquake").
- Uses \`useListIncidents\` to fetch the tabular registry.

### \`IncidentDetail\` (\`/incidents/:id\`)
Deep dive into a specific incident.
- Displays metadata, a timeline of events, and a focused Area of Interest (AOI) minimap.
- Powered by \`useGetIncident(id)\`.

## Triage & Assessment

### \`Assessment\` (\`/assessment\`)
A map-first workspace designed for situational awareness and initial triage.
- Features heavy layer toggles (infrastructure, detections, weather).
- Powered by \`useListCases\` to populate map points.

### \`Cases\` (\`/cases\`)
The priority queue. A dense data table view of all cases.
- Sorted by priority score and confidence level.
- Designed for bulk review and filtering.

### \`CaseDetail\` (\`/cases/:id\`)
The comprehensive view for a single case.
- **Before/After Imagery**: Side-by-side or slider views of satellite imagery.
- **Priority Ledger**: Explains exactly how the Priority Engine calculated the score.
- **Response Card**: Actionable area to spawn tasks or change case status.

### \`Review\` (\`/review/:id\`)
The Human-in-the-loop (HITL) adjudication screen.
- Allows analysts to quickly cycle through AI-detected cases.
- Actions: Confirm, Reject, or mark Uncertain.
- Triggers \`useReviewCase()\`, which actively invalidates the \`['incident-map']\` cache to update the map globally.

## Response & Operations

### \`Tasks\` (\`/tasks\`)
A Kanban board visualizing task progression.
- Columns: Queued, In Progress, Completed.
- Drag-and-drop or click-to-move interactions via \`useUpdateTask()\`.

### \`TaskDetail\` (\`/tasks/:id\`)
Detailed inspection of a single task.
- Shows assignment details, SLA timers, and a verification checklist.

### \`Field\` (\`/field\`)
A mobile-optimized interface for on-the-ground responders.
- Heavily relies on offline sync capabilities.
- Allows capturing evidence (photos, notes) which queue locally if connectivity drops.

## System & Analytics

### \`Analytics\` (\`/analytics\`)
Deeper insights into operational efficiency.
- Charts: Funnel charts for case progression, scatter plots (Confidence vs Priority).
- Metrics: SLA adherence by team.

### \`Demo\` (\`/demo\`)
A specialized engine for scenario simulation.
- 5-step progress UI.
- Actions: \`useLoadDemo()\` to seed database state, \`useResetDemo()\` to clear it.

### \`Settings\` (\`/settings\`)
Configuration interface.
- Lists demo user directory.
- Toggles for integration adapters (mock vs real systems).
  `.trim());

  write('04-frontend/03-components.md', `
# UI Components & Map Engine

<span className="badge-implemented">Implemented</span>

## IncidentMap Deep-Dive

**Source:** \`src/components/IncidentMap.tsx\`

The \`IncidentMap\` is the most complex component in the application, leveraging \`react-map-gl/maplibre\` and \`maplibre-gl\` for high-performance vector rendering.

### Data Fetching
It fetches data using \`GET /api/incidents/\${incidentId}/map\` with the query key \`['incident-map', incidentId]\`. This payload includes the AOI, critical assets, AI detections, and case data.

### Rendering Layers
The map renders 6 distinct GeoJSON layers to build the tactical picture:

1. **AOI Polygon**: 
   - Fill: \`#259184\` (opacity 0.1)
   - Border: Dashed
2. **Critical Assets**: 
   - Type: Circle (radius 8)
   - Color: \`#4a5568\`
3. **Detections (AI)**: 
   - Type: Circle (radius 4)
   - Color: \`#cd372f\`
4. **Cases**: 
   - Type: Circle (radius 6)
   - Color styling driven by status:
     - \`NEEDS_REVIEW\`: \`#EFAC30\` (Amber)
     - \`CONFIRMED\`: \`#259184\` (Teal)
     - \`REJECTED\`: \`#cd372f\` (Red)
     - \`CLOSED\`: \`#8b9b95\` (Slate)
5. **Field Observations**: 
   - Type: Circle (radius 5)
   - Color: \`#259184\`

### Interactivity
- **Case Click**: Navigates the user to \`/cases/\${id}\`.
- **Asset Click**: Displays an alert or tooltip with the asset's name and type.

## UI Component Library

**Source:** \`src/components/ui/\`

The application utilizes 55 custom UI primitives built on top of **Radix UI**. This ensures accessibility (ARIA compliance, keyboard navigation) while allowing complete styling freedom via Tailwind CSS.

Key components include:
- \`Button\`, \`Input\`, \`Dialog\`, \`DropdownMenu\`, \`Toast\`, \`Tooltip\`, \`Tabs\`

## Design System

The design language reflects a tactical, high-contrast environment suitable for emergency operations centers (EOCs) and field devices.

### Typography
- **Body**: *DM Sans* (highly legible for dense data).
- **Display**: *Barlow Condensed* (used for dashboard metrics and headers).
- **Data/Coordinates**: *IBM Plex Mono* (monospace for lat/lng, IDs).

### Theme Tokens
- **Background**: Dark tactical slate (\`#1a2332\`)
- **Primary**: Teal (\`#259184\`)
- **Accent/Warning**: Amber (\`#EFAC30\`)
- **Destructive/Critical**: Red (\`#cd372f\`)
  `.trim());

  write('04-frontend/04-offline-pwa.md', `
# Offline PWA Capabilities

<span className="badge-implemented">Implemented</span>

Field responders require continuous operation regardless of network reliability. DRAXELYRA utilizes Progressive Web App (PWA) technologies to ensure availability and data integrity during outages.

## Service Worker

**Source:** \`public/sw.js\`

The Service Worker intercepts network requests and manages the application cache.
- **Cache Name**: \`draxelyra-v1\`
- **Install Phase**: Caches the application shell (e.g., \`/\`, index.html, core CSS/JS) and immediately calls \`skipWaiting()\` to activate the new worker.
- **Activate Phase**: Claims all active clients, taking control immediately.
- **Fetch Strategy**:
  - Ignores non-GET requests.
  - Specifically bypasses any URLs containing \`/api/\` to prevent caching dynamic backend responses in the static cache.
  - Serves the cached application shell for navigation requests, allowing the app to boot offline.

## Offline Sync Engine

**Source:** \`src/lib/offline-sync.ts\`

When the app is offline, mutations (POST, PUT, DELETE) are intercepted and stored locally.

### IndexedDB Storage
- **Database**: \`draxelyra-offline\`, version 1.
- **Object Store**: \`syncQueue\`
  - Configured with \`keyPath: 'id'\` and \`autoIncrement: true\`.

### Core Exports
1. \`getOfflineDB()\`: Initializes and returns the IndexedDB connection.
2. \`queueRequest(url, method, body)\`: Serializes the failed API request and stores it in the \`syncQueue\`.
3. \`getQueue()\`: Retrieves all pending requests.
4. \`clearQueueItem(id)\`: Removes a request from the queue after successful synchronization.

### Conflict Resolution UI
The application monitors \`navigator.onLine\`. When connectivity is restored, a background process attempts to flush the \`syncQueue\`. If conflicts occur (e.g., a Case was updated by someone else, resulting in a Version Conflict), the UI presents a resolution dialog to the user, allowing them to force their update or pull the latest server state.
  `.trim());

  // ---------------------------------------------------------------------------
  // SECTION 05: BACKEND
  // ---------------------------------------------------------------------------

  write('05-backend/01-architecture.md', `
# Backend Architecture

<span className="badge-implemented">Implemented</span>

The Node.js backend is designed as a robust, stateless API layer sitting in front of a PostgreSQL database.

## Entry Point

**Source:** \`artifacts/api-server/src/index.ts\`

The boot process is straightforward:
- Reads the \`PORT\` from environment variables.
- Validates that \`PORT\` is numeric and > 0.
- Calls \`app.listen(port)\`.
- Logs the successful startup using the Pino logger.

## Express App & Middleware Chain

**Source:** \`artifacts/api-server/src/app.ts\`

The middleware chain is executed in the following EXACT order. This order is critical for security and payload parsing.

1. **\`pinoHttp\`**: 
   - Configured with \`logger\` and serializers: \`{ req: sanitize URL, res: statusCode }\`.
   - Provides structured JSON logging for every request.
2. **\`cors\`**: 
   - Configured with \`origin: true\` and \`credentials: true\` (permissive for current dev/staging).
3. **\`express.json()\`**: 
   - Parses incoming JSON payloads into \`req.body\`.
4. **\`express.urlencoded({ extended: true })\`**: 
   - Parses URL-encoded bodies.
5. **\`express-session\`**:
   - Store: \`connect-pg-simple\` (PostgreSQL-backed sessions).
   - Table: \`session\` in PostgreSQL.
   - Secret: \`process.env.SESSION_SECRET || 'draxelyra_default_secret'\`.
   - Cookie config: \`httpOnly: true\`, \`secure: NODE_ENV === 'production'\`, \`maxAge: 30 * 24 * 60 * 60 * 1000\` (30 days).
   - Settings: \`resave: false\`, \`saveUninitialized: false\`.
6. **Static File Serving**: 
   - \`express.static('uploads')\` mounted at \`/uploads\` to serve uploaded evidence.
7. **API Router**: 
   - All core logic is mounted at \`/api\`.

## Route Mounting

**Source:** \`routes/index.ts\`

- \`/api/health\` → \`healthRouter\`
- \`/api/auth\` → \`authRouter\`
- \`/api/incidents\` → \`incidentsRouter\`
- \`/api/cases\` → \`casesRouter\`
- \`/api/tasks\` → \`tasksRouter\`
- \`/api/analytics\` → \`analyticsRouter\`
- \`/api/demo\` → \`demoRouter\`
- \`/api/evidence\` → \`evidenceRouter\`
- \`/api/\` → \`operationsRouter\` (handles command summary and audit logs)

## Authentication Middleware

**Source:** \`middlewares/auth.ts\`

- **\`requireAuth(req, res, next)\`**: Checks for \`req.session?.userId\`. If missing, returns 401 with payload: \`{ error: { code: 'UNAUTHORIZED' } }\`.
- **\`requireRole(...roles)\`**: First checks auth (401), then verifies if \`roles.includes(req.session.role)\`. Returns 403 FORBIDDEN if the user lacks clearance.

## Pino Logger

**Source:** \`lib/logger.ts\`

- **Level**: \`process.env.LOG_LEVEL ?? 'info'\`.
- **Redactions**: Prevents leaking secrets to logs. Redacts \`req.headers.authorization\`, \`req.headers.cookie\`, and \`res.headers['set-cookie']\`.
- **Transport**: Uses \`pino-pretty\` in development for human-readable logs, and outputs raw JSON in production environments.
  `.trim());

  write('05-backend/02-services.md', `
# Domain Services

<span className="badge-implemented">Implemented</span>

Business logic is isolated from route handlers into dedicated domain services. This ensures reusability and simplifies testing.

## Case State Machine

**Source:** \`services/case-state-machine.ts\`

Cases progress through a strict lifecycle. Invalid transitions throw errors.

**Allowed Transitions:**
- \`DETECTED\` → [\`NEEDS_REVIEW\`]
- \`NEEDS_REVIEW\` → [\`CONFIRMED\`, \`REJECTED\`, \`UNCERTAIN\`]
- \`CONFIRMED\` → [\`PRIORITIZED\`, \`TASKED\`]
- \`PRIORITIZED\` → [\`TASKED\`]
- \`TASKED\` → [\`IN_PROGRESS\`]
- \`IN_PROGRESS\` → [\`FIELD_VERIFIED\`, \`ACTIONED\`]
- \`FIELD_VERIFIED\` → [\`ACTIONED\`]
- \`ACTIONED\` → [\`CLOSED\`]
- \`UNCERTAIN\` → [\`CLOSED\`]
- \`REJECTED\` → [\`CLOSED\`]
- \`CLOSED\` → []

**Implementation details (\`transitionCase\` function):**
- Executes entirely within a \`db.transaction()\`.
- Checks \`expectedVersion\`. Throws \`VERSION_CONFLICT\` if the database version is higher (Optimistic Concurrency Control).
- Validates the transition graph.
- Updates the case, incrementing the version by 1.
- Inserts a record into \`caseStatusHistory\`.
- Emits records to \`auditEvents\`.

## Task State Machine

**Source:** \`services/task-state-machine.ts\`

Tasks track physical or analytical work.

**Allowed Transitions:**
- \`UNASSIGNED\` → [\`ASSIGNED\`]
- \`ASSIGNED\` → [\`IN_PROGRESS\`, \`UNASSIGNED\`]
- \`IN_PROGRESS\` → [\`BLOCKED\`, \`COMPLETED\`, \`VERIFIED\`]
- \`BLOCKED\` → [\`IN_PROGRESS\`, \`UNASSIGNED\`]
- \`COMPLETED\` → [\`VERIFIED\`, \`CLOSED\`]
- \`VERIFIED\` → [\`CLOSED\`]
- \`CLOSED\` → []

Uses the identical OCC pattern as cases. Automatically populates \`completedAt\` timestamps upon entering terminal states.

## Priority Engine

**Source:** \`lib/priority.ts\`

Calculates the operational priority of a case (0-100 scale).

**Formula:**
\`round(0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * (confidence * 100))\`

- **S (Severity)**: destroyed=100, severe=75, moderate=45, uncertain=35, minor=20, no damage=0.
- **C (Criticality)**: hospital/emergency=100, bridge=85, gov/utility=75, school=70, residential=40, commercial=30, default=15.
- **E (Exposure)**: high=90, medium=55, low=20.
- **U (Urgency)**: \`min(100, max(0, 100 - (hours/72)*100) + (accessConstrained ? 20 : 0))\`
- **Confidence**: AI detection confidence score (0.0 to 1.0).

## Evidence Upload Pipeline

**Source:** \`routes/evidence.ts\`

Handles secure file uploads from the field.
- **Storage**: Uses Multer with memory storage.
- **Limits**: 50MB maximum file size.
- **MIME Whitelist**: \`image/jpeg\`, \`image/png\`, \`image/webp\`, \`video/mp4\`.
- **Validation**: Performs magic byte checking on the buffer (JPEG=FFD8FF, PNG=89504E47, WebP=RIFF+WEBP, MP4=ftyp) to prevent spoofed extensions.
- **Integrity**: Calculates a SHA-256 hash of the buffer.
- **Security**: Prevents path traversal by validating that the resolved path strictly \`startsWith(uploadsDir)\`.
- **Persistence**: Writes buffer to disk and inserts an \`evidence\` record in the database.
  `.trim());

  write('05-backend/03-error-handling.md', `
# Error Handling

<span className="badge-implemented">Implemented</span>

The backend utilizes a standardized JSON error envelope for all client responses. This ensures the frontend can parse errors predictably.

## The Error Envelope

Every failed request returns a payload structured like this:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description",
    "details": {} 
  }
}
\`\`\`

## HTTP Status Codes Mapping

We strictly map domain errors to appropriate HTTP status codes:

- **400 Bad Request**: Validation failures (e.g., Zod schema parsing fails).
  - \`code\`: \`VALIDATION_ERROR\`
  - \`details\`: Array of specific field errors.
- **401 Unauthorized**: Missing or invalid session.
  - \`code\`: \`UNAUTHORIZED\`
- **403 Forbidden**: Valid session, but insufficient role permissions.
  - \`code\`: \`FORBIDDEN\`
- **404 Not Found**: Resource does not exist (Case, Task, Incident).
  - \`code\`: \`NOT_FOUND\`
- **409 Conflict**: Optimistic Concurrency Control failure.
  - \`code\`: \`VERSION_CONFLICT\`
  - Triggered when \`expectedVersion\` does not match the database.
- **422 Unprocessable Entity**: Business logic violations.
  - \`code\`: \`INVALID_STATE_TRANSITION\`
  - Triggered by the state machine services.
- **500 Internal Server Error**: Uncaught exceptions.
  - \`code\`: \`INTERNAL_ERROR\`
  - Stack traces are stripped in production.

## Example: Version Conflict Response

\`\`\`json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The case was modified by another user. Please refresh and try again.",
    "details": {
      "providedVersion": 4,
      "currentVersion": 5
    }
  }
}
\`\`\`
  `.trim());
}
