# DRAXELYRA
Disaster Intelligence & Response OS

[![Live Production App](https://img.shields.io/badge/Railway-Live%20App-0B0D0E?style=for-the-badge&logo=railway)](https://disaster-intelligence-response-os.up.railway.app/)
[![Documentation Website](https://img.shields.io/badge/docs-live%20website-259184?style=for-the-badge&logo=docusaurus)](https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/)
[![GitHub Actions CI](https://img.shields.io/badge/CI-passing-brightgreen?style=for-the-badge&logo=githubactions)](https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS/actions)

> 🚀 **Live Production Application**: **[https://disaster-intelligence-response-os.up.railway.app/](https://disaster-intelligence-response-os.up.railway.app/)**  
> 📖 **Technical Documentation Website**: **[https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/](https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/)**

DRAXELYRA is an end-to-end disaster response operating system that converts post-disaster satellite imagery, weather telemetry, and multi-agency sensor feeds into explainable priority queues, accountable field tasks, and verified outcomes for emergency management operations.

---

## Overview

During major disaster events (urban floods, cyclones, landslides, and earthquakes), emergency command centers are inundated with unstructured incoming reports, remote sensing data, and conflicting damage reports. DRAXELYRA bridges the gap between raw intelligence and field action by providing:

- **Live Multi-Source Ingestion**: Continuous background ingestion from USGS Earthquakes, GDACS Multi-Hazard Alerts, Open-Meteo Weather, NASA FIRMS/EONET, and NDMA/SACHET bulletins.
- **Explainable Evidence-to-Action Scoring**: Deterministic 5-factor priority formula combining damage severity, asset criticality, population exposure, proximity penalties, and model confidence.
- **Interactive Global Crisis Switcher**: Dynamic header dropdown synchronizing the Command Center, Geospatial Workspace, Priority Queue, and Task Manager across active crisis zones.
- **Accountable Task Lifecycle**: Formal finite state machines governing case lifecycle (from detection to triage, assignment, field observation, and outcome verification).
- **Real-Time WebSocket Gateway**: Low-latency bi-directional event stream (`/ws`) backed by a Transactional Outbox and optimistic client caching.
- **Optimistic Concurrency Control (OCC)**: Version-checked domain entities preventing concurrent write collisions (HTTP 409 handling).
- **Offline Field Synchronization**: PWA field interface enabling responders to document observations offline and auto-sync when connectivity resumes.
- **Dual-Engine Persistence**: High-throughput PostgreSQL with dynamic pooling and automatic embedded PGlite fallback for zero-dependency standalone execution.

---

---

## 🎯 What is DRAXELYRA & What Problem Does It Solve?

During major crisis events, emergency response agencies suffer from **"Data Deluge vs. Action Paralysis"**:

```
❌ Traditional Emergency Response Pain Points:
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│  Disparate Raw Data      │    │  Opaque Prioritization   │    │  Unverified Field Action │
│  • Satellite TIFFs       │───>│  • "Black box" AI scores │───>│  • Duplicated dispatches │
│  • Unstructured reports  │    │  • Conflicting triage    │    │  • No offline sync       │
│  • Siloed agency APIs    │    │  • Lost write collisions │    │  • Lost accountability   │
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘

✅ DRAXELYRA End-to-End Operating Picture:
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│  Continuous Live Ingest  │    │  Explainable Priority    │    │  Accountable Verification│
│  • USGS, GDACS, Meteo    │───>│  • 5-factor math formula │───>│  • FSM lifecycle states │
│  • NASA FIRMS, NDMA      │    │  • Realtime OCC locks    │    │  • Offline-first PWA sync│
│  • OSM infrastructure    │    │  • WebSocket live sync   │    │  • Zero-trust audit trail│
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

---

## 🏛️ System Architecture Diagram

DRAXELYRA connects satellite remote sensing, global hazard APIs, deterministic state machines, and real-time operational interfaces through an event-driven architecture:

```mermaid
flowchart TB
    subgraph INGESTION["1. Multi-Source Live Telemetry & Ingestion"]
        direction LR
        USGS["USGS (Earthquakes M2.5+)"]
        GDACS["GDACS (Multi-Hazard Alerts)"]
        METEO["Open-Meteo (Severe Weather)"]
        NASA["NASA FIRMS / EONET (Wildfire)"]
        NDMA["NDMA / SACHET (India Alerts)"]
        OSM["OSM Overpass (Critical Assets)"]
        SAT["Satellite Rasters (Sentinel / Landsat)"]
    end

    subgraph ENGINE["2. Intelligence & Processing Core"]
        NORM["Multi-Hazard Normalizer & Ingestion Engine"]
        AI["Damage Detection & Footprint Extractor"]
        SCORER["Explainable 5-Factor Priority Scorer\n(Severity + Asset + Exposure + Distance + Confidence)"]
    end

    subgraph STORAGE["3. State Machines & Dual-Engine Persistence"]
        OUTBOX["Transactional Outbox Event Log"]
        FSM["Finite State Machine (Case & Task Lifecycle)"]
        OCC["Optimistic Concurrency Control (OCC Versioning)"]
        DB[("Dual-Engine Database\nPostgreSQL 15+ / Embedded PGlite WASM")]
    end

    subgraph REALTIME["4. Real-Time Distribution Gateway"]
        WS["WebSocket Gateway (/ws)"]
        SSE["Server-Sent Events & Replay Stream"]
        BROADCAST["Multi-Tab BroadcastChannel Sync"]
    end

    subgraph INTERFACES["5. Operational Command & Field Frontends"]
        direction LR
        CMD["Command Center (Situation Overview)"]
        GIS["Geospatial Workspace (MapLibre GL + 10 AOIs)"]
        QUEUE["Explainable Priority Queue (Analyst Triage)"]
        TASKS["Response Task Manager (Dispatch & SLA)"]
        FIELD["Field Verification PWA (Offline Sync)"]
    end

    INGESTION --> NORM
    NORM --> AI
    AI --> SCORER
    SCORER --> FSM
    FSM --> DB
    FSM --> OUTBOX
    OUTBOX --> WS
    OUTBOX --> SSE
    WS --> REALTIME
    REALTIME --> INTERFACES
```

---

## 🔄 Finite State Machine & Case Lifecycle

Every disaster damage detection progresses through a strictly audited, tamper-evident Finite State Machine (FSM):

```mermaid
stateDiagram-v2
    [*] --> DETECTED: Satellite / Sensor Ingestion
    DETECTED --> TRIAGED: Priority Scorer (Score >= 75: High)
    
    state TRIAGED {
        [*] --> UNDER_REVIEW
        UNDER_REVIEW --> CONFIRMED: Analyst Verification
        UNDER_REVIEW --> UNCERTAIN: Needs Ground Truth
        UNDER_REVIEW --> REJECTED: False Positive / Cloud Artifact
    }
    
    CONFIRMED --> TASKED: Operational Task Created
    UNCERTAIN --> TASKED: Reconnaissance Task Created
    
    state TASKED {
        [*] --> ASSIGNED: Dispatched to Field Team
        ASSIGNED --> IN_PROGRESS: Team On Site
        IN_PROGRESS --> BLOCKED: Access Route Inundated
        BLOCKED --> IN_PROGRESS: Alternate Route Identified
        IN_PROGRESS --> COMPLETED: Evidence & Coordinates Logged
    }
    
    TASKED --> VERIFIED: Field Inspection Verified
    VERIFIED --> [*]: Outcome Closed with Audit Trail
```

---

## Key Capabilities & Features

- **Command Center Dashboard**: Real-time situational awareness metrics, active incidents summary, severity distributions, and critical asset tracking.
- **Geospatial Workspace**: Interactive MapLibre GL mapping with clean OpenStreetMap raster tiles, Esri satellite imagery toggle, and 10 dynamic Indian & global disaster region presets (Chennai, Mumbai, Kolkata, Brahmaputra Basin, Kochi, Delhi NCR, Wayanad Highland, Dehradun Valley, Shimla).
- **Explainable Priority Queue**: Transparent mathematical score calculation with 5 weighted criteria, complete evidence cards, and analyst triage controls (Confirm, Uncertain, Reject).
- **Task Dispatch & Management**: Operational dispatch of actionable response tasks to field teams with priority ratings, target coordinates, due dates, and escalation timeouts.
- **Field Verification & Mobile Sync**: Mobile-responsive field inspection view supporting offline observation logging, geolocation tracking, and conflict detection.
- **Zero-Trust Audit & Provenance**: Cryptographic lineage graph tracing every case from raw satellite/sensor ingestion to analyst review and field task verification.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Analysts, Field Responders, Managers, Incident Commanders, Organization Admins, and System Admins.
- **Deterministic Replay Mode**: Built-in historical flood scenario replay (Chennai Urban Flood AOI) for training, testing, and operational simulation.

---

## Architecture

DRAXELYRA is structured as a TypeScript monorepo using **pnpm workspaces**:

```
DRAXELYRA-Response-OS/
├── artifacts/
│   ├── api-server/         # Express 5 backend API server (Auth, RBAC, State Machines, Audit)
│   ├── draxelyra/          # React 19 + Vite frontend command center
│   └── mockup-sandbox/     # UI component sandbox and preview harness
├── lib/
│   ├── api-spec/           # OpenAPI 3.0 specification & Orval codegen config
│   ├── api-zod/            # Generated Zod validation schemas & TypeScript types
│   ├── api-client-react/   # Generated React Query hooks & API client
│   └── db/                 # Drizzle ORM schema, migrations, and PostgreSQL client
├── scripts/                # Development & maintenance scripts
├── docker-compose.yml      # Local PostgreSQL container service definition
├── package.json            # Root workspace configuration & scripts
└── pnpm-workspace.yaml     # pnpm workspace definition & catalog
```

### Core Technologies
- **Runtime & Language**: Node.js (>= 20), TypeScript 5.9
- **Package Manager**: pnpm (Workspaces + Catalog)
- **Backend**: Express 5, `express-session`, `connect-pg-simple`, `bcryptjs`, `pino`
- **Frontend**: React 19, Vite 7, `@tanstack/react-query`, `wouter`, Tailwind CSS, `lucide-react`, Radix UI primitives
- **Database & ORM**: PostgreSQL 15+, Drizzle ORM (`drizzle-kit`)
- **API Spec & Codegen**: OpenAPI 3.0 (`openapi.yaml`), Orval
- **Testing**: Vitest

---

## Requirements

- **Node.js**: `v20.x` or `v22.x` / `v24.x`
- **pnpm**: `v9.x` or later (`corepack enable && corepack use pnpm@latest`)
- **PostgreSQL**: `v15.x` or later (or Docker for running containerized PostgreSQL)

---

## Installation

1. Clone or extract the repository:
   ```bash
   cd DRAXELYRA-Response-OS
   ```

2. Install workspace dependencies:
   ```bash
   pnpm install
   ```

3. (Optional) Run TypeScript typecheck to verify installation:
   ```bash
   pnpm run typecheck
   ```

---

## Environment Setup

1. Copy the example environment template:
   ```bash
   cp .env.example .env
   ```

2. Configure the `.env` file with your local parameters:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/draxelyra
   SESSION_SECRET=your_secure_random_session_secret_here
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   VITE_PORT=5173
   BASE_PATH=/
   ```

---

## Database Setup

### Option 1: Using Docker Compose (Recommended for Local Dev)
Start a local PostgreSQL 15 instance on port 5433:
```bash
docker-compose up -d
```

### Option 2: Using Native PostgreSQL
Create a database named `draxelyra` in your local PostgreSQL server:
```sql
CREATE DATABASE draxelyra;
```
Ensure your `DATABASE_URL` in `.env` reflects your database connection credentials.

---

## Migration

Apply the Drizzle ORM database migrations:

```bash
# Push schema directly to database (development)
pnpm --filter @workspace/db run push

# Or execute migration runner
pnpm --filter @workspace/db exec tsx migrate.ts
```

---

## Demo Seed

To populate the database with the deterministic Chennai flood scenario and default demo users:

1. Start the API server:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

2. Authenticate as System Admin and trigger the demo reset endpoint:
   - **Endpoint**: `POST /api/demo/load` or `POST /api/demo/reset`
   - **Default Demo Accounts**:
     - `admin@draxelyra.local` / `demo123` (System Admin)
     - `analyst@draxelyra.local` / `demo123` (Analyst)
     - `manager@draxelyra.local` / `demo123` (Manager)
     - `field@draxelyra.local` / `demo123` (Field Responder)
     - `commander@draxelyra.local` / `demo123` (Commander)
     - `orgadmin@draxelyra.local` / `demo123` (Organization Admin)

---

## Development

Run both the API server and the frontend application concurrently:

```bash
pnpm dev
```

Or run individual services independently:

- **API Server** (Default port `3000` / `5000`):
  ```bash
  pnpm --filter @workspace/api-server run dev
  ```

- **Frontend Command Center** (Default port `5173`):
  ```bash
  pnpm --filter @workspace/draxelyra run dev
  ```

- **UI Mockup Sandbox** (Default port `5174`):
  ```bash
  pnpm --filter @workspace/mockup-sandbox run dev
  ```

---

## Testing

Run unit and integration test suites via Vitest:

```bash
pnpm test
```

To run end-to-end API verification against a running server:
```bash
node test-e2e.js
```

---

## Build

Compile and bundle all packages for production:

```bash
pnpm run build
```

This command runs `typecheck` across all workspace libraries and artifacts, and generates production bundles:
- `artifacts/api-server/dist/` (esbuild CJS bundle)
- `artifacts/draxelyra/dist/` (Vite client bundle)

---

## Deployment

### Option 1: Railway Continuous Deployment (Recommended)

1. Connect the GitHub repository `rohitkumarnaidu/Disaster-Intelligence-Response-OS` in [Railway](https://railway.com/).
2. Add a **PostgreSQL** database service in Railway.
3. Configure the following environment variables on the web service:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   SESSION_SECRET=your_production_secure_secret_key
   ```
4. Railway builds via the production `Dockerfile` (Debian Bookworm + Node 22 + glibc) and auto-deploys every `git push origin main` with zero downtime.

### Option 2: Production Container / Docker Deployment

1. Build and run using Docker:
   ```bash
   docker build -t draxelyra-os .
   docker run -p 3000:3000 -e DATABASE_URL=postgresql://user:pass@host:5432/draxelyra draxelyra-os
   ```

2. Or run via pnpm:
   ```bash
   pnpm run build
   pnpm start
   ```

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── middlewares/    # Auth, session & RBAC middleware
│   │   │   ├── routes/         # REST API routes (analytics, auth, cases, demo, evidence, incidents, tasks)
│   │   │   ├── services/       # Finite state machine logic for cases & tasks
│   │   │   ├── lib/            # Priority scoring algorithm & logger
│   │   │   ├── app.ts          # Express application setup
│   │   │   └── index.ts        # Server entrypoint
│   │   └── build.mjs           # Server build bundle configuration
│   ├── draxelyra/
│   │   ├── src/
│   │   │   ├── components/     # UI components & interactive MapLibre map
│   │   │   ├── hooks/          # UI hooks & mobile responsiveness
│   │   │   ├── lib/            # Auth provider & offline sync engine
│   │   │   ├── pages/          # Login, not-found, and main views
│   │   │   ├── App.tsx         # Main operations interface & routing
│   │   │   └── main.tsx        # React root entrypoint
│   │   └── vite.config.ts      # Vite configuration
│   └── mockup-sandbox/         # Component testing and preview sandbox
├── lib/
│   ├── api-spec/               # OpenAPI spec (openapi.yaml) & Orval configuration
│   ├── api-zod/                # Generated Zod validation models
│   ├── api-client-react/       # Generated React Query hooks & custom fetcher
│   └── db/
│       ├── src/
│       │   ├── schema/         # Drizzle database table definitions
│       │   └── index.ts        # Database connection & pooling
│       ├── migrations/         # SQL migration scripts
│       └── drizzle.config.ts   # Drizzle Kit configuration
├── scripts/                    # Maintenance & utility scripts
├── docker-compose.yml          # Local PostgreSQL docker service
├── package.json                # Workspace root package config
└── pnpm-workspace.yaml         # pnpm workspace configuration
```

---

## Security

- **No Hardcoded Secrets**: All credentials and sensitive connection parameters are loaded via environment variables (`.env`).
- **Session Authentication**: Secure HTTP-only cookies with server-side session persistence in PostgreSQL (`connect-pg-simple`).
- **Password Hashing**: Industry-standard `bcryptjs` salted hashing for user credentials.
- **Role-Based Access Control**: Strict endpoint-level RBAC enforcing least-privilege operations.
- **Optimistic Concurrency Control**: Entity versioning (`version` column) prevents lost updates and concurrent overwrites during triage and field updates.
- **Supply-Chain Hardening**: Configured `pnpm-workspace.yaml` with minimum package release age defense against supply-chain attacks.

---

## Known Limitations

- **Demo Replay Scope**: The default demo replay uses synthetic / historical dataset bounding boxes centered around the Chennai urban flood AOI for demonstration and evaluation purposes.
- **Satellite Ingestion Adapter**: In the current release, satellite imagery ingestion is structured via mock adapters and pre-packaged GeoTIFF/PNG layers; real-time satellite orbital tasking hooks can be attached via the adapter interfaces in `artifacts/api-server/src/routes/evidence.ts`.
- **Offline Storage Limit**: Offline IndexedDB caching is scoped to active operational cases within the assigned responder's queue.
