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

export function generateOverview(docsDir) {
  console.log('Generating 01-overview and 02-getting-started...');

  const write = (relPath, content) => writeFile(docsDir, relPath, content);

  // 01-overview/introduction.md
  write('01-overview/introduction.md', `---

id: introduction
title: Introduction & Problem Statement
sidebar_label: Introduction
sidebar_position: 1
---

# Introduction & Operational Mission

<span className="badge-implemented">Implemented</span>

In rapid-onset disasters—such as urban flash floods, cyclones, and seismic events—command centers face an acute operational bottleneck: raw Earth Observation (EO) satellite passes and sensor feeds generate vast volumes of unverified damage signals that cannot be translated into rapid, auditable field operations. DRAXELYRA bridges this gap by converting post-event satellite imagery into **explainable priority queues**, **finite-state response tasks**, and **tamper-evident, field-verified outcomes**.


\`\`\`mermaid
flowchart LR
    A[Earth Observation / Satellite Imagery] --> B[Detection & Change Analysis]
    B --> C[Explainable Priority Engine]
    C --> D[Human-in-the-Loop Review]
    D --> E[Accountable Response Tasking]
    E --> F[Offline-First Field Verification]
    F --> G[Tamper-Evident Audit & Outcome]
\`\`\`

---

## The Four Core Operational Failure Modes Addressed

1. **The Black-Box Confidence Trap**: Generic computer vision models produce statistical confidence scores (e.g., "88% confidence of change") that do not communicate whether the site represents a flooded tertiary hospital or an empty parking lot. DRAXELYRA separates statistical confidence from operational consequence using an explainable multi-factor scoring model.
2. **Disconnected Evidence and Operational Action**: Geospatial analysts frequently isolate change detections in standalone GIS workstations, leaving dispatch boards and emergency responders out of sync. DRAXELYRA creates an integrated pipeline where detected anomalies directly generate versioned operational cases.
3. **Severe Network Degradation in Disaster Theaters**: Responders in affected zones frequently lose broadband connectivity. DRAXELYRA treats network disconnection as a normal operating condition by buffering all field observations and task updates in browser IndexedDB queues and synchronizing them sequentially upon reconnection.
4. **Lack of Accountable Auditability in After-Action Reviews**: When post-incident investigations occur, organizations struggle to establish who authorized a triage decision or what imagery was reviewed. DRAXELYRA records an immutable, append-only audit ledger for every review, task transition, and evidence upload.

---

## Architectural Pillars & Implementation Status

| Architectural Layer | Implementation Technology | Source Location | Status |
| :--- | :--- | :--- | :--- |
| **Command Console** | React 19, Vite 7, Tailwind CSS v4, Wouter, Radix UI Primitives | \`artifacts/draxelyra/src/\` | <span className="badge-implemented">Implemented</span> |
| **Geospatial Engine** | MapLibre GL, React-Map-GL, GeoJSON FeatureCollections, Carto Vector Basemaps | \`artifacts/draxelyra/src/components/map/\` | <span className="badge-implemented">Implemented</span> |
| **Priority Engine** | Deterministic multi-factor scoring algorithm (\`0.30*S + 0.25*C + 0.20*E + 0.15*U + 0.10*K\`) | \`artifacts/api-server/src/lib/priority.ts\` | <span className="badge-implemented">Implemented</span> |
| **State Machines** | Strict finite state machines for Cases and Tasks with atomic CAS OCC | \`artifacts/api-server/src/services/\` | <span className="badge-implemented">Implemented</span> |
| **Offline Sync** | IndexedDB mutation buffer (\`draxelyra-offline\`) with custom event bus | \`artifacts/draxelyra/src/lib/offline-sync.ts\` | <span className="badge-implemented">Implemented</span> |
| **Evidence Pipeline** | Multipart upload with magic-byte validation and SHA-256 integrity hashes | \`artifacts/api-server/src/routes/evidence.ts\` | <span className="badge-implemented">Implemented</span> |
| **Backend & Storage** | Express 5, PostgreSQL 15, Drizzle ORM, connect-pg-simple session store | \`artifacts/api-server/src/\`, \`lib/db/\` | <span className="badge-implemented">Implemented</span> |
| **Scenario Replay** | Deterministic Chennai Urban Flood historical dataset (\`inc-chennai-demo\`) | \`artifacts/api-server/src/routes/demo-data.ts\` | <span className="badge-dev">Development Replay</span> |
| **AI Inference Adapter** | Change-detector v2.4.1 mock adapter for predictable scenario testing | \`lib/db/src/schema/index.ts\` | <span className="badge-mock">Mock Adapter</span> |

---

## Intended Engineering Audience

This technical documentation site provides comprehensive architecture, codebase references, and operational runbooks for:

- **Software Engineers & Architects**: Designing, extending, or refactoring the monorepo services and database schema.
- **Frontend Engineers**: Building UI components, integrating MapLibre layers, and handling offline sync queues.
- **DevOps & SREs**: Containerizing services, provisioning PostgreSQL, and managing environment pipelines.
- **Security & Compliance Reviewers**: Auditing authentication, session storage, RBAC middleware, and file upload integrity.
- **ML / Geospatial Engineers**: Integrating real-world Earth Observation pipelines (Sentinel-2, Planet Labs, Maxar) and fine-tuning change-detection models.
`);

  // 01-overview/product-overview.md
  write('01-overview/product-overview.md', `# Product Overview

<span className="badge-implemented">Implemented</span>

DRAXELYRA organizes emergency disaster operations into interconnected tactical workspaces designed for high-density command center displays and mobile field units.

\`\`\`mermaid
graph TD
    subgraph Command Workspace
        A[Command Center Dashboard] --> B[Incident Registry]
        B --> C[Assessment Map]
    end
    subgraph Operational Triage
        C --> D[Priority Queue]
        D --> E[Evidence Comparison & Review]
    end
    subgraph Execution & Field
        E --> F[Response Tasks Board]
        F --> G[Offline Field Verification]
        G --> H[Analytics & After-Action Audit]
    end
\`\`\`

---

## Key Operational Workspaces

### 1. Situation Overview (Command Center)
- **Real-Time Operational Metrics**: Displays active backlog count, high-priority cases (score &ge; 75), open tasks, overdue SLA tasks, confirmation rates, and response health.
- **Geospatial Area of Interest (AOI)**: Interactive MapLibre GL map rendering incident boundaries, high-severity detection clusters, and infrastructure locations.
- **Recent Activity Stream**: Chronological feed of human triage actions, satellite pass ingestions, and task escalations.

### 2. Incident Registry & AOI Configuration
- Create and manage multi-hazard incidents (Urban Flood, Cyclone, Earthquake, Wildfire).
- Define spatial boundary polygons (GeoJSON Polygon) and operational metadata (Disaster Type, Severity, Source, Incident Timelines).

### 3. Assessment & Geospatial Workspace
- Triage detected anomalies directly on the map.
- Toggle between GIS layers: *Change Signal*, *Critical Infrastructure Assets*, and *Inundation/Flood Extent*.
- Filter candidate signals by asset classification (*Transport*, *Utilities*, *Civilian*, *Water Control*).

### 4. Explainable Priority Queue
- Ranks every detected case according to a deterministic multi-factor score (0–100).
- Explicitly separates **AI Confidence** from **Action Priority**.
- Full visibility into human review states (\`NEEDS_REVIEW\`, \`CONFIRMED\`, \`REJECTED\`, \`UNCERTAIN\`).

### 5. Evidence Review Workspace
- Split-screen visual comparison of baseline (pre-disaster) and post-event imagery.
- Breakdown of model metadata (model name, version, detection threshold, capture timestamp).
- Human decision ledger with mandatory rationale and notes for durable audit trails.

### 6. Response Task Board & SLA Escalation
- Converts confirmed cases into actionable response tasks assigned to liaison teams and tactical users.
- SLA computation based on priority:
  - **Critical Priority (Score &ge; 75)**: 30-minute SLA window.
  - **High Priority (Score 45–74)**: 2-hour SLA window.
  - **Standard Priority (Score &lt; 45)**: 8-hour SLA window.
- Visual escalation indicators when SLA timers expire without verification.

### 7. Field Verification & Offline Operations
- Mobile-responsive interface for tactical units conducting physical site inspections.
- Works offline in disconnected zones via IndexedDB request queuing.
- Captures ground observations, verification status, notes, and geolocated photos.

### 8. Analytics & Funnel Metrics
- Executive dashboard tracking the incident progression funnel: \`Detected -> Reviewed -> Tasked -> Field Verified -> Closed\`.
- False-positive analysis, average time-to-assess, average time-to-verify, and SLA compliance metrics.
`);

  // 01-overview/core-concepts.md
  write('01-overview/core-concepts.md', `# Core Concepts

<span className="badge-implemented">Implemented</span>

Understanding DRAXELYRA requires familiarity with its core domain entities, scoring methodologies, and architectural boundaries.

---

## 1. Incidents
An **Incident** represents an active disaster operation bounded in time, geography, and hazard type.
- **Identifier**: e.g., \`INC-CHN-01\` or \`inc-chennai-demo\`
- **Area of Interest (AOI)**: GeoJSON Polygon defining the operational theater.
- **Hazard Type**: Categorical identifier (e.g., \`Urban flood\`, \`Earthquake\`, \`Cyclone\`).
- **Severity**: Operational rating (\`low\`, \`medium\`, \`high\`, \`critical\`).

## 2. Critical Infrastructure Assets
Fixed physical assets whose disruption endangers life safety or operational continuity.
- **Asset Types**: \`Hospital\`, \`Bridge\`, \`Utility\`, \`Government\`, \`School\`, \`Residential\`, \`Commercial\`.
- **Criticality Score**: Baseline importance metric (e.g., Hospitals = 100, Bridges = 85, Commercial = 30).
- **Population Exposure Tier**: Population vulnerability rating (\`High\`, \`Medium\`, \`Low\`).

## 3. Detections
Machine-generated candidate anomalies extracted from pre- and post-event imagery.
- **Model Metadata**: \`modelName\` (e.g., \`change-detector\`), \`modelVersion\` (e.g., \`v2.4.1\`), \`inferenceTimestamp\`.
- **Confidence**: Model statistical confidence score (0.00 to 1.00).
- **Damage Classification**: \`No damage\`, \`Minor\`, \`Moderate\`, \`Severe\`, \`Destroyed\`, \`Uncertain\`.

## 4. Cases
A **Case** is the central operational unit in DRAXELYRA. It couples an AI Detection with a specific Critical Asset and Incident.
- **Review State**: \`PENDING\`, \`CONFIRMED\`, \`REJECTED\`, \`UNCERTAIN\`.
- **Status Lifecycle**: \`DETECTED -> NEEDS_REVIEW -> CONFIRMED -> PRIORITIZED -> TASKED -> IN_PROGRESS -> FIELD_VERIFIED -> ACTIONED -> CLOSED\`.
- **Optimistic Concurrency Version**: Integer incremented on every mutation to prevent conflicting triage decisions.

## 5. Explainable Priority
A computed integer score (0–100) reflecting operational urgency. Unlike raw ML confidence, Priority incorporates structural damage, facility criticality, exposed population, and time decay.

## 6. Response Tasks
Discrete operational orders assigned to response teams (e.g., Public Works, Field Verification Cell) to validate or remediate a confirmed case.

## 7. Field Observations & Evidence
Ground-truth photos, sensor telemetry, and inspection notes uploaded by tactical personnel. Every artifact undergoes SHA-256 hashing and magic-byte inspection.

## 8. Audit Events
An immutable log of every status transition, review decision, task assignment, and upload, preserving an accountable record for post-incident review.
`);

  // 01-overview/terminology.md
  write('01-overview/terminology.md', `# Terminology & Acronyms

| Term / Acronym | Definition | Context in DRAXELYRA |
| :--- | :--- | :--- |
| **AOI** | Area of Interest | GeoJSON polygon outlining the geographical boundary of a disaster incident. |
| **EO** | Earth Observation | Satellite, drone, and aerial sensor data used for damage detection. |
| **OCC** | Optimistic Concurrency Control | Version-check pattern preventing simultaneous conflicting edits by multiple analysts. |
| **CAS** | Compare-And-Swap | Atomic SQL update technique (\`WHERE id = ? AND version = ?\`) enforcing OCC. |
| **RBAC** | Role-Based Access Control | Authorization system controlling endpoint access based on assigned organizational roles. |
| **SLA** | Service Level Agreement | Target time window within which a high-priority task must be accepted and acted on. |
| **Magic Bytes** | File Header Signatures | Leading bytes of binary files (e.g., \`FF D8 FF\` for JPEG) inspected to prevent extension spoofing. |
| **PWA** | Progressive Web Application | Architecture allowing the web console to run offline on mobile devices. |
| **IndexedDB** | In-Browser NoSQL Database | Local storage engine used to buffer offline mutations before synchronization. |
| **Drizzle ORM** | TypeScript SQL ORM | Database toolkit defining PostgreSQL schemas and type-safe relational queries. |
| **Orval** | OpenAPI Codegen Engine | Generates React Query hooks and TypeScript client bindings from \`openapi.yaml\`. |
| **Pino** | Structured JSON Logger | High-performance logging framework used across API server routes. |
| **Hero Case** | Canonical Demo Case (\`C-1048\`) | Seeded case (Hospital structure damage in Chennai) used to demonstrate deterministic triage. |
`);

  // 02-getting-started/prerequisites.md
  write('02-getting-started/prerequisites.md', `# Prerequisites

<span className="badge-implemented">Implemented</span>

Before developing or deploying DRAXELYRA, ensure your local or server environment satisfies the following requirements.

---

## 1. System Requirements

- **Operating System**: Linux (Ubuntu 22.04+ recommended), macOS (13+), or Windows 11 with WSL2 / PowerShell 7.
- **RAM**: Minimum 8 GB (16 GB recommended for running full PostgreSQL and multiple Vite dev servers).
- **Disk Space**: Minimum 10 GB free space for Node.js modules, PostgreSQL volumes, and evidence uploads.

---

## 2. Core Tooling & Runtimes

| Tool | Required Version | Purpose | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | \`v24.x\` or \`v20.x LTS\` | JavaScript runtime | \`node -v\` |
| **pnpm** | \`v10.x\` or \`v11.x\` | Monorepo package manager | \`pnpm -v\` |
| **PostgreSQL** | \`v15.x\` or \`v16.x\` | Relational database | \`psql --version\` |
| **Docker & Compose** | \`v24+\` / \`v2.20+\` | Optional containerized database | \`docker compose version\` |
| **Git** | \`2.40+\` | Version control | \`git --version\` |

---

## 3. Package Manager Configuration (\`pnpm\`)

The DRAXELYRA monorepo uses **pnpm workspaces** with strict supply-chain security rules. Ensure \`pnpm\` is installed globally:

\`\`\`bash
# Install pnpm using Corepack (recommended with Node.js)
corepack enable
corepack prepare pnpm@latest --activate

# Or install via npm
npm install -g pnpm
\`\`\`

:::note Supply Chain Security
The repository enforces \`minimumReleaseAge: 1440\` (24 hours) in \`pnpm-workspace.yaml\` to protect against npm supply-chain attacks. All packages must meet this release age unless explicitly whitelisted.
:::
`);

  // 02-getting-started/installation.md
  write('02-getting-started/installation.md', `# Installation Guide

<span className="badge-implemented">Implemented</span>

Follow these steps to clone the repository, install dependencies across the monorepo, and prepare the workspace.

---

## 1. Clone the Repository

\`\`\`bash
git clone https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS.git
cd Disaster-Intelligence-Response-OS
\`\`\`

---

## 2. Install Dependencies

Install all packages across the root workspace, \`lib/*\`, and \`artifacts/*\`:

\`\`\`bash
pnpm install
\`\`\`

This installs:
- Monorepo developer tooling (\`typescript\`, \`vitest\`, \`eslint\`, \`tsx\`, \`docusaurus\`)
- Backend dependencies (\`express\`, \`drizzle-orm\`, \`bcryptjs\`, \`connect-pg-simple\`, \`multer\`, \`pino\`)
- Frontend packages (\`react\`, \`vite\`, \`tailwindcss\`, \`maplibre-gl\`, \`@tanstack/react-query\`, \`wouter\`)

---

## 3. Verify TypeScript Builds

Build the shared libraries (\`lib/api-zod\`, \`lib/api-client-react\`, \`lib/db\`):

\`\`\`bash
pnpm run typecheck:libs
\`\`\`

Run full typecheck across all applications:

\`\`\`bash
pnpm run typecheck
\`\`\`
`);

  // 02-getting-started/local-development.md
  write('02-getting-started/local-development.md', `# Local Development Workflow

<span className="badge-implemented">Implemented</span>

DRAXELYRA is structured as a multi-tier monorepo. During local development, the PostgreSQL database, Express API server, and Vite frontend run concurrently.

---

## 1. Start the PostgreSQL Database

You can run PostgreSQL locally or launch the bundled Docker Compose service:

\`\`\`bash
docker compose up -d
\`\`\`

This starts PostgreSQL 15 on port \`5433\` (mapped from container port 5432) with database name \`draxelyra\`.

---

## 2. Push Database Schema & Migrations

Push the Drizzle ORM schema to the local PostgreSQL database:

\`\`\`bash
pnpm --filter @workspace/db run push
\`\`\`

---

## 3. Run API Server & Frontend Concurrently

Run the primary development script from the workspace root:

\`\`\`bash
pnpm run dev
\`\`\`

This executes:
1. \`pnpm -F @workspace/db run push\` (Synchronizes schema)
2. \`pnpm -F @workspace/api-server run dev\` (Starts Express server on \`http://localhost:5000\`)
3. \`pnpm -F @workspace/draxelyra run dev\` (Starts Vite command console on \`http://localhost:5173\` or configured dev port)

---

## 4. Available Monorepo Scripts

| Command | Action |
| :--- | :--- |
| \`pnpm run dev\` | Starts DB sync, Express backend, and Vite frontend. |
| \`pnpm run build\` | Runs TypeScript checks and builds all packages. |
| \`pnpm run typecheck\` | Executes \`tsc\` across all libraries and artifacts. |
| \`pnpm run test\` | Runs Vitest test suites. |
| \`pnpm run docs:dev\` | Starts the Docusaurus documentation website locally. |
| \`pnpm run docs:build\` | Compiles static documentation site for deployment. |
| \`pnpm --filter @workspace/api-spec run codegen\` | Regenerates API client hooks & Zod schemas from \`openapi.yaml\`. |
`);

  // 02-getting-started/environment-variables.md
  write('02-getting-started/environment-variables.md', `# Environment Variables Reference

<span className="badge-implemented">Implemented</span>

DRAXELYRA services read configuration from environment variables defined in \`.env\` files or container environments.

---

## Core Configuration Reference

| Variable | Description | Required | Default Value | Example |
| :--- | :--- | :--- | :--- | :--- |
| \`DATABASE_URL\` | PostgreSQL connection URI | **Yes** | — | \`postgres://postgres:postgres@localhost:5433/draxelyra\` |
| \`PORT\` | HTTP port for the Express API server | No | \`5000\` | \`5000\` |
| \`SESSION_SECRET\` | Secret key used to sign Express session cookies | **Yes (Prod)** | \`draxelyra_default_secret\` | \`c89f3a1e9b724f8d...a4e7\` |
| \`NODE_ENV\` | Runtime environment mode | No | \`development\` | \`production\` / \`development\` |
| \`VITE_API_URL\` | Custom API base URL for frontend client | No | \`/api\` (relative) | \`http://localhost:5000/api\` |

---

## Sample \`.env\` File

Create a \`.env\` file in the project root:

\`\`\`ini
# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/draxelyra

# API Server Port
PORT=5000

# Session Cookie Encryption Secret
SESSION_SECRET=e7b4c921389e4726af829103c847e920d3f2810a9c

# Node Runtime Mode
NODE_ENV=development
\`\`\`
`);

  // 02-getting-started/first-run.md
  write('02-getting-started/first-run.md', `# First Run & Verification Walkthrough

<span className="badge-implemented">Implemented</span> <span className="badge-dev">Development Replay</span>

Follow this step-by-step walkthrough to verify your installation, seed the deterministic demo dataset, and execute your first operational triage run.

---

## Step 1: Access the Web Console

Open your browser and navigate to \`http://localhost:5173\` (or \`http://localhost:5000\` in unified proxy mode). You will be presented with the DRAXELYRA authentication screen.

---

## Step 2: Sign In with a Demo Account

Use one of the pre-configured operational accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Duty Officer / Analyst** | \`analyst@draxelyra.local\` | \`demo123\` | Review signals, confirm/reject cases, inspect evidence |
| **System Admin** | \`admin@draxelyra.local\` | \`demo123\` | Full system control, load demo scenarios, manage users |
| **Field Responder** | \`field@draxelyra.local\` | \`demo123\` | Update task status, upload field observations |
| **Manager** | \`manager@draxelyra.local\` | \`demo123\` | Assign tasks, review analytics, adjust priorities |

---

## Step 3: Load the Deterministic Scenario Replay

1. Sign in as \`admin@draxelyra.local\`.
2. Navigate to **Demo replay** in the sidebar (\`/demo\`).
3. Click **Load Scenario Replay** (or send \`POST /api/demo/load\`).
4. This idempotently seeds the **Chennai Urban Flood** dataset (\`inc-chennai-demo\`), critical facilities, candidate detections, and the hero case (\`C-1048\`).

---

## Step 4: Triage the Hero Case (\`C-1048\`)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Analyst as Maya Chen (Analyst)
    participant UI as Command Console
    participant API as Express API
    participant DB as PostgreSQL

    Analyst->>UI: Select Hero Case C-1048
    UI->>API: GET /api/cases/C-1048
    API->>DB: Query case + detection + asset
    DB-->>API: Return case details (version: 1)
    API-->>UI: Render before/after imagery & factor ledger
    Analyst->>UI: Confirm Signal with Notes
    UI->>API: POST /api/cases/C-1048/review (decision: confirmed, version: 1)
    API->>DB: Atomic CAS update version 1 -> 2, write audit event
    DB-->>API: Success
    API-->>UI: Updated case state (CONFIRMED, Priority: 83)
\`\`\`

1. Navigate to **Priority queue** (\`/cases\`).
2. Select **C-1048** (*Flood impact at Government General Hospital*).
3. Review the before/after Sentinel-2 imagery split and inspect the **Priority Ledger**:
   - Severity: Severe (22.5 pts)
   - Criticality: Hospital (25.0 pts)
   - Exposure: High (18.0 pts)
   - Urgency: 12.0 pts
   - Confidence: 55% = 5.5 pts
   - **Total Priority Score: 83**
4. Click **Review evidence** (\`/review/C-1048\`), add review rationale notes, and click **Confirm signal**.
5. Navigate to **Response tasks** (\`/tasks\`) to create and assign an immediate field verification order.
`);
}
