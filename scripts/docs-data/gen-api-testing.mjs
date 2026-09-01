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

export function generateApiTesting(docsDir) {
  console.log('Generating 14-api, 15-testing, 16-security, and 17-deployment...');

  // ===========================================================================
  // 14-api
  // ===========================================================================

  // 14-api/01-overview.md
  writeFile(docsDir, '14-api/01-overview.md', `---
id: overview
title: REST API Architecture & Standards
sidebar_label: API Overview
sidebar_position: 1
---

# REST API Architecture & Standards

<span className="badge-implemented">Implemented</span>

The DRAXELYRA API is a type-safe RESTful interface mounted at \`/api\` on port \`3000\`. It enforces JSON error envelopes, Zod input validation, session cookie authentication, and Optimistic Concurrency Control.

---

## Global Request & Response Conventions

- **Base URL**: \`http://localhost:3000/api\` (or \`https://response-os.agency.gov/api\`)
- **Transport**: HTTPS (HTTP/2 in production reverse proxy).
- **Authentication**: Signed HTTP-only cookie \`connect.sid\` sent automatically with requests (\`credentials: 'include'\`).
- **Content Type**: \`application/json\` for mutations; \`multipart/form-data\` for evidence uploads.
- **Error Format**:
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
`);

  // 14-api/02-incidents.md
  writeFile(docsDir, '14-api/02-incidents.md', `---
id: incidents
title: Incidents API Specification
sidebar_label: Incidents Endpoints
sidebar_position: 2
---

# Incidents API Specification

<span className="badge-implemented">Implemented</span>

Manages disaster incident aggregate theaters, boundaries, and spatial map layers.

---

### \`GET /api/incidents\`
Lists all active, monitoring, and archived disaster incidents.
- **Roles**: All Authenticated.
- **Response**: \`200 OK\` Array of incident records.

---

### \`POST /api/incidents\`
Declares a new operational crisis aggregate.
- **Roles**: \`System Administrator\`, \`Incident Commander\`.
- **Request Body**:
  \`\`\`json
  {
    "name": "Cyclone Remal Response",
    "disasterType": "CYCLONE",
    "severity": "CRITICAL",
    "aoi": {
      "type": "Polygon",
      "coordinates": [[[92.65, 24.70], [93.00, 24.70], [93.00, 25.00], [92.65, 25.00], [92.65, 24.70]]]
    },
    "startTime": "2024-05-26T00:00:00.000Z",
    "source": "IMD"
  }
  \`\`\`
- **Response**: \`201 Created\` Incident object with \`version: 1\`.

---

### \`GET /api/incidents/:id/map\`
Returns the unified GeoJSON map DTO containing the AOI perimeter, critical assets, AI detections, cases, and field observations for WebGL rendering.
- **Roles**: All Authenticated.
- **Response**: \`200 OK\` GeoJSON FeatureCollections bundle.
`);

  // 14-api/03-cases.md
  writeFile(docsDir, '14-api/03-cases.md', `---
id: cases
title: Cases API Specification
sidebar_label: Cases Endpoints
sidebar_position: 3
---

# Cases API Specification

<span className="badge-implemented">Implemented</span>

Handles human adjudication, priority triage, and case lifecycle transitions.

---

### \`GET /api/cases\`
Fetches prioritized operational cases with filtering by \`status\`, \`incidentId\`, and \`minPriority\`.
- **Roles**: All Authenticated.
- **Response**: \`200 OK\` Array of case records with priority breakdowns.

---

### \`POST /api/cases/:id/review\`
Adjudicates an AI candidate detection, enforcing OCC version checking.
- **Roles**: \`Duty Officer\`, \`Incident Commander\`.
- **Request Body**:
  \`\`\`json
  {
    "decision": "CONFIRMED",
    "expectedVersion": 2,
    "notes": "Verified severe standing water flooding ground floor hospital trauma center."
  }
  \`\`\`
- **Response**:
  - \`200 OK\`: Case transitioned to \`CONFIRMED\` with \`version: 3\`.
  - \`409 Conflict\`: Version mismatch error envelope.
`);

  // 14-api/04-tasks.md
  writeFile(docsDir, '14-api/04-tasks.md', `---
id: tasks
title: Tasks API Specification
sidebar_label: Tasks Endpoints
sidebar_position: 4
---

# Tasks API Specification

<span className="badge-implemented">Implemented</span>

Manages field response work orders and dynamic SLA tracking.

---

### \`POST /api/tasks\`
Spawns a new response task linked to a confirmed case.
- **Roles**: \`Duty Officer\`, \`Incident Commander\`, \`Field Lead\`.
- **Request Body**:
  \`\`\`json
  {
    "caseId": "C-1048",
    "title": "Deploy High-Capacity De-Watering Pumps",
    "taskType": "DEWATERING",
    "assignedUnit": "NDRF 1st Bn Team B"
  }
  \`\`\`
- **Response**: \`201 Created\` Task object with computed \`slaDeadline\`.

---

### \`POST /api/tasks/:id/verify\`
Verifies task completion with physical evidence.
- **Roles**: \`Field Lead\`, \`Incident Commander\`.
- **Request Body**:
  \`\`\`json
  {
    "expectedVersion": 2,
    "verificationStatus": "CONFIRMED_DAMAGED",
    "notes": "Pumps operational. Flood level decreased by 45cm."
  }
  \`\`\`
- **Response**: \`200 OK\` Task transitioned to \`VERIFIED\`.
`);

  // 14-api/05-evidence.md
  writeFile(docsDir, '14-api/05-evidence.md', `---
id: evidence
title: Evidence & Uploads API Specification
sidebar_label: Evidence Endpoints
sidebar_position: 5
---

# Evidence & Uploads API Specification

<span className="badge-implemented">Implemented</span>

Handles forensic photo, video, and drone telemetry uploads.

---

### \`POST /api/evidence\`
Uploads a forensic media file with magic-byte validation and SHA-256 hashing.
- **Content-Type**: \`multipart/form-data\`
- **Form Fields**: \`file\` (binary), \`caseId\` (string).
- **Limits**: 50MB max file size; JPEG, PNG, WebP, MP4 only.
- **Response**: \`201 Created\` Evidence metadata record with storage URI and checksum.
`);

  // 14-api/06-ai-processing.md
  writeFile(docsDir, '14-api/06-ai-processing.md', `---
id: ai-processing
title: AI Inference & Processing Jobs API
sidebar_label: AI & Processing
sidebar_position: 6
---

# AI Inference & Processing Jobs API

<span className="badge-implemented">Implemented</span>

---

### \`POST /api/ai/assess\`
Executes multimodal damage assessment on an imagery pair.
- **Request Body**: \`{ "incidentId": "inc_1", "preImageryId": "img_pre", "postImageryId": "img_post", "criticalAssetId": "asset_1" }\`
- **Response**: \`200 OK\` Conforming to Zod \`DamageAssessmentOutputSchema\`.

---

### \`GET /api/processing/jobs\`
Lists background satellite download and change detection jobs.
- **Response**: \`200 OK\` Array of processing job records with statuses.
`);

  // 14-api/07-integrations.md
  writeFile(docsDir, '14-api/07-integrations.md', `---
id: integrations
title: Integrations & Telemetry API Specification
sidebar_label: Integrations Endpoints
sidebar_position: 7
---

# Integrations & Telemetry API Specification

<span className="badge-implemented">Implemented</span>

---

### \`POST /api/integrations/sync\`
Triggers an immediate polling cycle across all external data feeds (USGS, GDACS, SACHET).
- **Roles**: \`System Administrator\`, \`Incident Commander\`.
- **Response**: \`200 OK\` Sync summary with counts of ingested alerts.

---

### \`POST /api/integrations/osm/sync\`
Triggers OpenStreetMap Overpass extraction for the active incident AOI.
- **Response**: \`200 OK\` Count of ingested critical assets.
`);

  // 14-api/08-analytics.md
  writeFile(docsDir, '14-api/08-analytics.md', `---
id: analytics
title: Analytics & Summary API Specification
sidebar_label: Analytics Endpoints
sidebar_position: 8
---

# Analytics & Summary API Specification

<span className="badge-implemented">Implemented</span>

---

### \`GET /api/operations/summary\`
Returns the global executive dashboard metrics (active incidents, unreviewed cases, active tasks, SLA breaches).
- **Roles**: All Authenticated.
- **Response**: \`200 OK\` KPI summary object.
`);

  // ===========================================================================
  // 15-testing
  // ===========================================================================

  // 15-testing/01-testing-strategy.md
  writeFile(docsDir, '15-testing/01-testing-strategy.md', `---
id: testing-strategy
title: Testing Strategy & Automated Quality Gates
sidebar_label: Testing Strategy
sidebar_position: 1
---

# Testing Strategy & Automated Quality Gates

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces rigorous automated testing covering unit formulas, state machine transitions, concurrent race conditions, API contracts, and end-to-end browser flows.

\`\`\`mermaid
flowchart TD
    UNIT["Unit Tests (Vitest)<br/>Priority Formula, Geo Utils, Zod Schemas"]
    OCC["Concurrency Tests (Vitest & Supertest)<br/>10 Concurrent CAS Updates (1 Winner, 9 HTTP 409s)"]
    INT["API Integration Tests (Supertest)<br/>Auth, RBAC Guards, State Machines, Outbox"]
    E2E["E2E Tests (Playwright)<br/>Login, Map Navigation, Triage Adjudication, Offline Sync"]
    DOCS["Docs Build Validation<br/>Docusaurus zero broken links check"]

    UNIT --> OCC --> INT --> E2E --> DOCS
\`\`\`

---

## Test Execution Commands

\`\`\`bash
# Run unit tests across all workspace packages
pnpm run test

# Run API integration tests against isolated PostgreSQL test container
pnpm --filter @workspace/api-server run test

# Run Vitest in watch mode during active development
pnpm --filter @workspace/api-server run test:watch

# Execute Playwright end-to-end test suite
pnpm run test:e2e

# Validate documentation compilation and link integrity
pnpm run docs:build
\`\`\`
`);

  // ===========================================================================
  // 16-security
  // ===========================================================================

  // 16-security/01-security-model.md
  writeFile(docsDir, '16-security/01-security-model.md', `---
id: security-model
title: Security Model, Hardening & Threat Defense
sidebar_label: Security Model
sidebar_position: 1
---

# Security Model, Hardening & Threat Defense

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a defense-in-depth security model engineered for high-consequence crisis response infrastructure.

---

## Core Security Controls

1. **Session Protection**: Signed HTTP-only, \`SameSite=Lax\`, secure cookies stored in PostgreSQL via \`connect-pg-simple\`.
2. **Strict RBAC Enforcement**: Role clearance validated at middleware boundary before route execution.
3. **Magic-Byte File Verification**: Uploaded evidence buffers inspected for true binary signatures, rejecting spoofed extensions.
4. **Directory Traversal Defense**: File paths sanitized and verified to reside strictly within the designated storage root.
5. **Prompt Injection Shielding**: External feed text sanitized and wrapped in structured delimiter blocks before passing to Multimodal AI models.
6. **Immutable Audit Trails**: Non-repudiable audit logging for all case status mutations and forensic uploads.
`);

  // ===========================================================================
  // 17-deployment
  // ===========================================================================

  // 17-deployment/01-deployment-guide.md
  writeFile(docsDir, '17-deployment/01-deployment-guide.md', `---
id: deployment-guide
title: Production Deployment & Container Orchestration
sidebar_label: Deployment Guide
sidebar_position: 1
---

# Production Deployment & Container Orchestration

<span className="badge-implemented">Implemented</span>

DRAXELYRA is packaged as a multi-container Docker Compose deployment designed for cloud VMs or on-premise emergency operations center servers.

---

## Multi-Container Docker Topology

\`\`\`mermaid
flowchart TD
    subgraph Host["Production Server / EOC Host"]
        NGINX["Nginx Reverse Proxy (:80 / :443 SSL)"]
        WEB["Frontend Static Container (Vite Nginx)"]
        API["Backend API Container (Node.js Express :3000)"]
        DB[("PostgreSQL 15 Container (:5432)")]
        VOL[("Persistent Docker Volume (/uploads)")]
    end

    CLIENT["Internet / EOC Intranet"] --> NGINX
    NGINX -->|/| WEB
    NGINX -->|/api & /ws| API
    API --> DB
    API --> VOL
\`\`\`

---

## Environment Configuration (\`.env.production\`)

\`\`\`bash
# Server Port & Mode
PORT=3000
NODE_ENV=production

# Database Connection URL
DATABASE_URL=postgresql://postgres:your_db_password_here@postgres:5432/draxelyra

# Session Security Secret (Generate with openssl rand -base64 32)
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# Multimodal AI Credentials (Optional: Falls back to baseline engine if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# Persistent Evidence Storage Directory
UPLOAD_DIR=/uploads
\`\`\`

---

## Launch Sequence

\`\`\`bash
# 1. Build multi-stage Docker images
docker compose -f docker-compose.yml build

# 2. Start PostgreSQL, API Server, and Web client containers in background
docker compose -f docker-compose.yml up -d

# 3. Apply Drizzle database migrations
docker compose exec api-server pnpm --filter @workspace/db run db:push

# 4. Confirm system health
curl http://localhost:3000/api/health
\`\`\`
`);

}

