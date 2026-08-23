# DRAXELYRA
Disaster Intelligence & Response OS

[![Documentation Website](https://img.shields.io/badge/docs-live%20website-259184?style=for-the-badge&logo=docusaurus)](https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/)
[![GitHub Actions CI](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS/actions)

> 📖 **Official Technical Documentation Website**: **[https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/](https://rohitkumarnaidu.github.io/Disaster-Intelligence-Response-OS/)**

DRAXELYRA is an end-to-end disaster response operating system that converts post-disaster satellite imagery and sensory data into explainable priority queues, accountable response tasks, and field-verified outcomes for emergency management operations.

---

## Overview

During major disaster events (such as urban floods, cyclones, and earthquakes), emergency command centers are inundated with unstructured incoming reports, remote sensing data, and conflicting damage reports. DRAXELYRA bridges the gap between raw intelligence and field action by providing:

- **Evidence-to-Action Pipeline**: Explainable prioritization combining damage severity, asset criticality, population exposure, and model confidence into deterministic priority scores.
- **Accountable Task Lifecycle**: Formal finite state machines governing case lifecycle (from detection to triage, assignment, field observation, and outcome verification).
- **Optimistic Concurrency Control (OCC)**: Versioned entities ensuring seamless multi-operator collaboration without overwrites.
- **Offline Field Synchronization**: PWA capabilities enabling field responders to document observations and sync when connectivity resumes.
- **Auditable History**: Comprehensive audit logging tracking all review decisions, state transitions, and operator interventions.

---

## Features

- **Command Center Dashboard**: Real-time situational awareness metrics, active incidents summary, severity distributions, and critical asset tracking.
- **Geospatial Incident Map**: Interactive MapLibre-powered mapping visualizing Area of Interest (AOI), damage detections, and critical infrastructure (e.g., hospitals, power stations).
- **Explainable Priority Queue**: Transparent score calculation detailing severity, asset type, population exposure tier, distance penalties, and confidence weighting.
- **Evidence Review & Triage**: Dual-pane comparison of pre/post disaster imagery, bounding box detections, and structured analyst review workflows.
- **Task Dispatch & Management**: Operational dispatch of actionable response tasks to field teams with priority, due dates, and escalation timeouts.
- **Field Verification & Mobile Sync**: Mobile-responsive field inspection interface supporting offline observation logging and conflict detection.
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

### Production Container Deployment
1. Build the production artifacts:
   ```bash
   pnpm run build
   ```
2. Run database migrations:
   ```bash
   pnpm --filter @workspace/db exec tsx migrate.ts
   ```
3. Start the production server:
   ```bash
   pnpm start
   ```

### Reverse Proxy & Static Asset Serving
In a unified deployment, the API server handles `/api/*` endpoints and can serve the frontend build from `artifacts/draxelyra/dist/public` or via an external ingress controller / CDN (e.g. Nginx, Cloudflare).

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
