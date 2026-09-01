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

export function generateOpsRef(docsDir) {
  console.log('Generating 18-maintenance, 19-contributing, 20-reference, and 21-roadmap...');

  // ===========================================================================
  // 18-maintenance
  // ===========================================================================

  // 18-maintenance/01-runbooks.md
  writeFile(docsDir, '18-maintenance/01-runbooks.md', `---
id: runbooks
title: Operational Runbooks & Maintenance Procedures
sidebar_label: Operational Runbooks
sidebar_position: 1
---

# Operational Runbooks & Maintenance Procedures

<span className="badge-implemented">Implemented</span>

This runbook provides emergency operations center sysadmins and DevOps engineers with standard operating procedures (SOPs) for routine maintenance, database backup/recovery, and incident remediation.

---

## 1. Database Backup & Point-in-Time Recovery

### Automated Full Dump
\`\`\`bash
# Create timestamped compressed PostgreSQL backup
docker exec -t draxelyra-postgres pg_dump -U postgres -d draxelyra -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump
\`\`\`

### Restore Procedure
\`\`\`bash
# Restore from archive into target database
docker exec -i draxelyra-postgres pg_restore -U postgres -d draxelyra --clean --if-exists -v /var/lib/postgresql/data/backup_20240526.dump
\`\`\`

---

## 2. Session Table Pruning
Expired session records stored via \`connect-pg-simple\` can be cleaned up manually if the automated cleaner is paused:

\`\`\`sql
DELETE FROM session WHERE expire < NOW();
\`\`\`

---

## 3. Clearing Stuck Processing Jobs
If an asynchronous satellite download or change-detection job hangs due to an external network timeout:

\`\`\`sql
UPDATE processing_jobs
SET status = 'FAILED',
    error_message = 'Manually timed out by operator after 30 minutes',
    updated_at = NOW()
WHERE status = 'RUNNING' AND updated_at < NOW() - INTERVAL '30 minutes';
\`\`\`
`);

  // 18-maintenance/02-troubleshooting.md
  writeFile(docsDir, '18-maintenance/02-troubleshooting.md', `---
id: troubleshooting
title: Production Troubleshooting & Error Remediation
sidebar_label: Troubleshooting Guide
sidebar_position: 2
---

# Production Troubleshooting & Error Remediation

<span className="badge-implemented">Implemented</span>

---

## Common Incident Failure Modes

### 1. HTTP 409 \`VERSION_CONFLICT\` Storms
- **Symptom**: Multiple operators report being unable to save reviews on high-priority cases.
- **Root Cause**: Two or more watchstanders are attempting to review the same incident simultaneously without refreshing their local client state.
- **Remediation**: Advise operators to click the amber "Load Latest Server State" toast alert. The UI will merge non-conflicting fields and update the \`expectedVersion\`.

---

### 2. MapLibre WebGL Context Loss
- **Symptom**: The tactical map canvas goes black or displays \`WebGL context lost\` in browser console.
- **Root Cause**: GPU memory exhaustion when loading large Sentinel-2 raster layers on integrated laptop GPUs.
- **Remediation**: The map error boundary automatically catches the failure and switches to low-overhead vector tile mode. If persistent, toggle off the High-Density Satellite Raster layer in Map Settings.

---

### 3. OpenStreetMap Overpass API 429 Rate Limiting
- **Symptom**: Automated critical asset extraction fails with HTTP 429 \`Too Many Requests\`.
- **Root Cause**: Main Overpass server (\`overpass-api.de\`) is experiencing heavy global community load.
- **Remediation**: \`osm-sync.ts\` automatically retries against secondary community mirrors (\`kumi.systems\`, \`private.overpass-api.de\`) with exponential backoff (2s, 4s, 8s).

---

### 4. Multimodal AI API Quota Exhaustion
- **Symptom**: Case creation continues, but AI damage reasoning fields display baseline synthetic metrics.
- **Root Cause**: \`GEMINI_API_KEY\` hit rate limits (15 RPM on free tier or billing threshold).
- **Remediation**: The system automatically degrades gracefully to \`MockVisionAssessmentProvider\` (\`draxelyra-cv-baseline-v2\`), logging the incident to \`ai_decision_logs\` without crashing the triage pipeline.
`);


  // ===========================================================================
  // 19-contributing
  // ===========================================================================

  // 19-contributing/01-development-setup.md
  writeFile(docsDir, '19-contributing/01-development-setup.md', `---
id: development-setup
title: Local Development Setup & Workflows
sidebar_label: Development Setup
sidebar_position: 1
---

# Local Development Setup & Workflows

<span className="badge-implemented">Implemented</span>

---

## Prerequisites
- **Node.js**: \`>= 20.10.0\`
- **pnpm**: \`>= 10.0.0\`
- **Docker**: For running PostgreSQL 15 datastore.
- **Git**: For version control.

---

## Step-by-Step Setup

\`\`\`bash
# 1. Clone repository
git clone https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS.git
cd Disaster-Intelligence-Response-OS

# 2. Install workspace dependencies
pnpm install

# 3. Start local PostgreSQL 15 database
docker compose -f docker-compose.yml up -d postgres

# 4. Configure environment variables
cp .env.example .env

# 5. Push schema migrations to PostgreSQL
pnpm --filter @workspace/db run db:push

# 6. Start development servers with HMR
pnpm run dev
\`\`\`

The command center will be available at \`http://localhost:5173\` and the backend API at \`http://localhost:3000\`.
`);

  // 19-contributing/02-coding-standards.md
  writeFile(docsDir, '19-contributing/02-coding-standards.md', `---
id: coding-standards
title: Engineering Standards & Code Governance
sidebar_label: Coding Standards
sidebar_position: 2
---

# Engineering Standards & Code Governance

<span className="badge-implemented">Implemented</span>

1. **Strict TypeScript**: No \`any\` types in domain entities or route handlers. All API request/response payloads must have corresponding Zod validation schemas.
2. **ACID Transaction Boundaries**: Any state transition involving multiple table updates must execute within \`db.transaction(async (tx) => ...)\`.
3. **Mandatory OCC Version Checks**: Mutable entity tables must include a \`version\` column and check \`version = expectedVersion\` on every update.
4. **Zero-Trust Documentation Rule**: Codebase implementation is the sole source of truth. Features must be explicitly badged (<span className="badge-implemented">Implemented</span>, <span className="badge-live">Real Data Mode</span>, <span className="badge-mock">Mock Baseline</span>).
`);

  // ===========================================================================
  // 20-reference
  // ===========================================================================

  // 20-reference/01-glossary.md
  writeFile(docsDir, '20-reference/01-glossary.md', `---
id: glossary
title: Disaster Intelligence & GIS Technical Glossary
sidebar_label: Glossary
sidebar_position: 1
---

# Disaster Intelligence & GIS Technical Glossary

<span className="badge-implemented">Implemented</span>

| Term | Category | Authoritative Technical Definition |
| :--- | :--- | :--- |
| **AOI** | Geospatial | **Area of Interest**: Bounding polygon defining the geographic perimeter of a disaster operation. |
| **CAP** | Ingestion | **Common Alerting Protocol (OASIS CAP-v1.2)**: XML emergency data exchange standard used by NDMA SACHET. |
| **CAS** | Concurrency | **Compare-And-Swap**: Atomic database update comparing the current version before applying an increment. |
| **COG** | Remote Sensing | **Cloud Optimized GeoTIFF**: Format allowing tile streaming via HTTP range requests. |
| **EOC** | Operations | **Emergency Operations Center**: Central command facility for disaster coordination. |
| **FIRMS** | Remote Sensing | **Fire Information for Resource Management System**: NASA satellite active thermal detection program. |
| **FSM** | Backend | **Finite State Machine**: State management model enforcing valid transitions between named states. |
| **GDACS** | Ingestion | **Global Disaster Alert and Coordination System**: Joint UN/EC multi-hazard monitoring framework. |
| **HITL** | AI / ML | **Human-in-the-Loop**: Operational design requiring human operator authorization for AI recommendations. |
| **MNDWI** | Remote Sensing | **Modified Normalized Difference Water Index**: Spectral ratio (Green - SWIR) / (Green + SWIR) for flood delineation. |
| **OCC** | Database | **Optimistic Concurrency Control**: Concurrency strategy detecting stale writes via monotonic versions. |
| **Overpass QL**| Geospatial | Query language used to interrogate OpenStreetMap spatial databases for critical infrastructure. |
| **SAR** | Remote Sensing | **Synthetic Aperture Radar**: Cloud-penetrating radar sensor (e.g., Sentinel-1) active day/night. |
| **SLA** | Operations | **Service Level Agreement**: Target operational time window for task completion based on priority. |
| **STAC** | Remote Sensing | **SpatioTemporal Asset Catalog**: JSON specification for querying Earth observation imagery catalogs. |
| **VIIRS** | Remote Sensing | **Visible Infrared Imaging Radiometer Suite**: Thermal sensor on Suomi NPP / NOAA-20 satellites. |
| **WAQI** | Ingestion | **World Air Quality Index**: Global real-time particulate air quality measurement project. |
| **WGS84** | Geospatial | **World Geodetic System 1984 (EPSG:4326)**: Standard coordinate reference system \`[lng, lat]\`. |


`);

  // 20-reference/02-configuration.md
  writeFile(docsDir, '20-reference/02-configuration.md', `---
id: configuration
title: Complete System Configuration Reference
sidebar_label: Configuration Matrix
sidebar_position: 2
---

# Complete System Configuration Reference

<span className="badge-implemented">Implemented</span>

All configuration variables supported by DRAXELYRA are documented below.

| Variable Name | Required? | Default Value | Description |
| :--- | :--- | :--- | :--- |
| **\`PORT\`** | Optional | \`3000\` | HTTP and WebSocket server listen port. |
| **\`NODE_ENV\`** | Optional | \`development\` | Environment mode: \`development\`, \`test\`, or \`production\`. |
| **\`DATABASE_URL\`** | **Required**| *(None)* | PostgreSQL connection URI (\`postgresql://user:pass@host:5432/db\`). |
| **\`SESSION_SECRET\`** | **Required**| \`draxelyra_default_secret\` | Cryptographic secret for signing session cookies. Must be 64+ hex characters in production. |
| **\`GEMINI_API_KEY\`** | Optional | *(None)* | Google Gemini AI API key. If absent, falls back to \`MockVisionAssessmentProvider\`. |
| **\`UPLOAD_DIR\`** | Optional | \`./uploads\` | Local filesystem directory for storing uploaded forensic evidence. |
| **\`DB_POOL_MAX\`** | Optional | \`20\` | Maximum active PostgreSQL connection pool connections. |
| **\`LOG_LEVEL\`** | Optional | \`info\` | Pino structured logging level: \`debug\`, \`info\`, \`warn\`, \`error\`. |
| **\`BASE_URL\`** | Optional | \`/\` | Frontend base URL for reverse proxy hosting. |
`);

  // ===========================================================================
  // 21-roadmap
  // ===========================================================================

  // 21-roadmap/01-production-roadmap.md
  writeFile(docsDir, '21-roadmap/01-production-roadmap.md', `---
id: production-roadmap
title: Strategic Production Roadmap & Future Architecture
sidebar_label: Production Roadmap
sidebar_position: 1
---

# Strategic Production Roadmap & Future Architecture

<span className="badge-planned">Future Strategic Architecture</span>

DRAXELYRA's technical evolution is structured into four upcoming phases:

---

## Phase 1: High-Throughput gRPC Tile Inference Stream
- Transitioning satellite raster tile change detection from REST to **gRPC bidirectional streaming**.
- Sub-second raster chip evaluation with distributed GPU worker nodes.

---

## Phase 2: WebRTC Tactical Drone Video Ingestion
- Ingesting real-time RTSP/WebRTC video streams from emergency reconnaissance drones.
- Frame-by-frame VLM object detection for survivors, vehicles, and active fire perimeters.

---

## Phase 3: Active Learning & Domain LoRA Fine-Tuning
- Continuous automated curation of duty officer confirmations and rejections from \`ai_evaluation_dataset\`.
- Scheduled LoRA (Low-Rank Adaptation) fine-tuning runs to customize foundation models to regional geography.

---

## Phase 4: Peer-to-Peer Mesh Synchronization
- Enabling field responder mobile devices to synchronize task observations over ad-hoc Bluetooth LE / Wi-Fi Direct mesh networks during complete communications blackout.
`);
  console.log('18-maintenance, 19-contributing, 20-reference, and 21-roadmap generated successfully.');
}

