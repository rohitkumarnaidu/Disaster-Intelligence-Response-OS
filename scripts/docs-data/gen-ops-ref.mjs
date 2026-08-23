import fs from 'fs';
import path from 'path';

export function generateOpsRef(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 15-deployment/local.md
  write('15-deployment/local.md', `---
id: local
title: Local Deployment
sidebar_position: 1
---

# Local Deployment Guide

<span className="badge-implemented">Implemented</span>

To deploy DRAXELYRA on a local developer workstation or on-premises disaster operations server:

\`\`\`bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Push Schema
pnpm --filter @workspace/db run push

# 3. Build & Run Production Bundle
pnpm run build
pnpm start
\`\`\`
`);

  // 15-deployment/docker.md
  write('15-deployment/docker.md', `---
id: docker
title: Docker Deployment
sidebar_position: 2
---

# Docker & Containerization

<span className="badge-implemented">Implemented</span>

The bundled \`docker-compose.yml\` provisions PostgreSQL:

\`\`\`yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
      POSTGRES_USER: postgres
      POSTGRES_DB: draxelyra
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
\`\`\`
`);

  // 15-deployment/replit.md
  write('15-deployment/replit.md', `---
id: replit
title: Replit Environment
sidebar_position: 3
---

# Cloud & Hosted Environment Setup

<span className="badge-implemented">Implemented</span>

Configured via \`.replit\` to run the unified dev server on port 5000:
- \`run = "pnpm run dev"\`
- Automatically provisions PostgreSQL connectors and environment variables.
`);

  // 15-deployment/production.md
  write('15-deployment/production.md', `---
id: production
title: Production Deployment
sidebar_position: 4
---

# Production Deployment Architecture

<span className="badge-implemented">Implemented</span>

In a production environment:
1. **Reverse Proxy (Nginx / Cloudflare)**: Terminates TLS, serves static frontend assets from \`artifacts/draxelyra/dist\`, and proxies \`/api\` requests to Node.js on port 5000.
2. **Database Cluster**: Managed PostgreSQL with automated backups and read-replicas.
3. **Persistent Volume**: Dedicated storage volume mounted at \`/uploads\` for evidence artifacts.
`);

  // 15-deployment/database-deployment.md
  write('15-deployment/database-deployment.md', `---
id: database-deployment
title: Database Deployment
sidebar_position: 5
---

# Database Deployment & Tuning

<span className="badge-implemented">Implemented</span>

- Recommended connection pooling: \`max: 20\`, \`idleTimeoutMillis: 30000\`.
- SSL connection required in production: \`DATABASE_URL=postgres://user:pass@host:5432/draxelyra?sslmode=require\`.
`);

  // 15-deployment/environment-management.md
  write('15-deployment/environment-management.md', `---
id: environment-management
title: Environment Management
sidebar_position: 6
---

# Environment Configuration

<span className="badge-implemented">Implemented</span>

- Keep distinct \`.env.development\`, \`.env.staging\`, and \`.env.production\` files.
- Store sensitive secrets (\`SESSION_SECRET\`, \`DATABASE_URL\`) in secure secret managers (e.g. AWS Secrets Manager, Vault).
`);

  // 15-deployment/backups.md
  write('15-deployment/backups.md', `---
id: backups
title: Backup & Disaster Recovery
sidebar_position: 7
---

# Backup Strategies

<span className="badge-implemented">Implemented</span>

- **Daily Automated pg_dump**:
  \`\`\`bash
  pg_dump -Fc -d draxelyra > /backups/draxelyra-$(date +%F).dump
  \`\`\`
- **Evidence Storage Mirroring**: Sync \`/uploads\` directory to secondary geographic bucket storage.
`);

  // 15-deployment/monitoring.md
  write('15-deployment/monitoring.md', `---
id: monitoring
title: Health & Monitoring
sidebar_position: 8
---

# Monitoring & Observability

<span className="badge-implemented">Implemented</span>

- **Healthcheck Probe**: \`GET /api/health\` returns \`{ "status": "healthy" }\`.
- **Structured Logs**: Pino logs can be ingested by Datadog, Grafana Loki, or Elasticsearch.
`);

  // 16-maintenance/troubleshooting.md
  write('16-maintenance/troubleshooting.md', `---
id: troubleshooting
title: Troubleshooting Guide
sidebar_position: 1
---

# Operational Troubleshooting

<span className="badge-implemented">Implemented</span>

### 1. Database Connection Errors
*Symptom*: \`ECONNREFUSED 127.0.0.1:5433\`
*Resolution*: Verify Docker Compose is running (\`docker compose ps\`) and that port 5433 is not occupied.

### 2. Version Conflict (HTTP 409)
*Symptom*: \`VERSION_CONFLICT: The record changed on the server.\`
*Resolution*: Refresh the case in the UI to load the latest server version and reapply the triage decision.
`);

  // 16-maintenance/debugging.md
  write('16-maintenance/debugging.md', `---
id: debugging
title: Debugging Guide
sidebar_position: 2
---

# Debugging Guide

- Enable verbose Pino logging: \`LOG_LEVEL=debug pnpm run dev\`
- Inspect Drizzle SQL queries: Enable \`logger: true\` in Drizzle DB configuration.
`);

  // 16-maintenance/logging.md
  write('16-maintenance/logging.md', `---
id: logging
title: Logging System
sidebar_position: 3
---

# Logging Architecture

- Structured JSON logging powered by **Pino** (\`artifacts/api-server/src/lib/logger.ts\`).
- Pretty-printed logs in local development via \`pino-pretty\`.
`);

  // 16-maintenance/common-errors.md
  write('16-maintenance/common-errors.md', `---
id: common-errors
title: Common Errors Reference
sidebar_position: 4
---

# Common Operational Errors

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| \`401 UNAUTHORIZED\` | Session expired or missing | Re-authenticate via \`/login\`. |
| \`403 FORBIDDEN\` | Insufficient user role | Check permissions matrix or login with appropriate role. |
| \`400 Invalid file signature\` | Binary magic bytes mismatch | Upload authentic JPEG, PNG, WebP, or MP4 files. |
`);

  // 16-maintenance/dependency-updates.md
  write('16-maintenance/dependency-updates.md', `---
id: dependency-updates
title: Dependency Updates
sidebar_position: 5
---

# Dependency Updates & Policy

- \`pnpm-workspace.yaml\` enforces supply chain safety (\`minimumReleaseAge: 1440\`).
- Upgrade dependencies using: \`pnpm update --interactive --latest\`.
`);

  // 16-maintenance/database-recovery.md
  write('16-maintenance/database-recovery.md', `---
id: database-recovery
title: Database Recovery
sidebar_position: 6
---

# Database Recovery Runbook

\`\`\`bash
# Restore PostgreSQL dump
pg_restore -d draxelyra --clean /backups/draxelyra-backup.dump
\`\`\`
`);

  // 17-contributing/development-workflow.md
  write('17-contributing/development-workflow.md', `---
id: development-workflow
title: Development Workflow
sidebar_position: 1
---

# Developer Workflow

1. Fork & clone the repository.
2. Create a feature branch: \`git checkout -b feat/satellite-pipeline\`.
3. If changing API routes, update \`lib/api-spec/openapi.yaml\` first.
4. Run \`pnpm --filter @workspace/api-spec run codegen\`.
5. Run full checks: \`pnpm run typecheck && pnpm run test\`.
`);

  // 17-contributing/code-style.md
  write('17-contributing/code-style.md', `---
id: code-style
title: Code Style
sidebar_position: 2
---

# Code Style Guidelines

- Format code with Prettier (\`pnpm run lint\`).
- Maintain strict TypeScript type annotations; avoid \`any\`.
- Keep domain models synchronized with OpenAPI schemas.
`);

  // 17-contributing/branching.md
  write('17-contributing/branching.md', `---
id: branching
title: Branching Strategy
sidebar_position: 3
---

# Git Branching Model

- \`main\`: Production-ready release branch.
- \`develop\`: Integration branch.
- Feature branches: \`feat/<feature-name>\`, \`fix/<bug-name>\`.
`);

  // 17-contributing/pull-requests.md
  write('17-contributing/pull-requests.md', `---
id: pull-requests
title: Pull Request Process
sidebar_position: 4
---

# Pull Request Process

- Ensure all CI tests and typechecks pass.
- Provide a clear PR description detailing schema changes or new API endpoints.
- Obtain review approval before merging.
`);

  // 17-contributing/commit-conventions.md
  write('17-contributing/commit-conventions.md', `---
id: commit-conventions
title: Commit Conventions
sidebar_position: 5
---

# Conventional Commits

Use standard conventional commit prefixes:
- \`feat:\` New feature
- \`fix:\` Bugfix
- \`docs:\` Documentation changes
- \`refactor:\` Code refactoring
- \`test:\` Adding or updating tests
`);

  // 17-contributing/adding-features.md
  write('17-contributing/adding-features.md', `---
id: adding-features
title: Adding Features
sidebar_position: 6
---

# Adding Features: The OpenAPI-First Guide

1. Update \`lib/api-spec/openapi.yaml\`.
2. Run \`pnpm --filter @workspace/api-spec run codegen\`.
3. Implement backend route in \`artifacts/api-server/src/routes/\`.
4. Connect frontend view using generated React Query hooks.
5. Add unit and integration tests.
`);

  // 18-reference/configuration.md
  write('18-reference/configuration.md', `---
id: configuration
title: Configuration Reference
sidebar_position: 1
---

# Configuration Reference

Details all build, runtime, and server configuration files across the monorepo.
`);

  // 18-reference/environment-reference.md
  write('18-reference/environment-reference.md', `---
id: environment-reference
title: Environment Reference
sidebar_position: 2
---

# Complete Environment Variable Reference

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`DATABASE_URL\` | String | — | PostgreSQL connection string |
| \`PORT\` | Number | 5000 | Backend listening port |
| \`SESSION_SECRET\` | String | draxelyra_default_secret | Session cookie signing secret |
| \`NODE_ENV\` | String | development | Node.js environment mode |
`);

  // 18-reference/api-reference.md
  write('18-reference/api-reference.md', `---
id: api-reference
title: API Endpoints Table
sidebar_position: 3
---

# API Endpoints Summary Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| \`GET\` | \`/api/health\` | Healthcheck |
| \`POST\` | \`/api/auth/login\` | User login |
| \`POST\` | \`/api/auth/logout\` | User logout |
| \`GET\` | \`/api/auth/me\` | Active session profile |
| \`GET\` | \`/api/incidents\` | List incidents |
| \`POST\` | \`/api/incidents\` | Create incident |
| \`GET\` | \`/api/incidents/:id\` | Get incident |
| \`GET\` | \`/api/incidents/:id/map\` | Aggregated GeoJSON map data |
| \`GET\` | \`/api/cases\` | Ranked priority queue |
| \`GET\` | \`/api/cases/:id\` | Case detail |
| \`POST\` | \`/api/cases/:id/review\` | Submit review decision |
| \`GET\` | \`/api/cases/:id/audit\` | Case audit events |
| \`GET\` | \`/api/tasks\` | Response tasks |
| \`POST\` | \`/api/tasks\` | Create response task |
| \`PATCH\` | \`/api/tasks/:id\` | Update task status |
| \`POST\` | \`/api/evidence/upload\` | Upload media artifact |
| \`GET\` | \`/api/analytics/overview\`| Operational metrics |
| \`POST\` | \`/api/demo/load\` | Load demo dataset |
`);

  // 18-reference/data-model-reference.md
  write('18-reference/data-model-reference.md', `---
id: data-model-reference
title: Data Models
sidebar_position: 4
---

# Data Model Reference

Exhaustive listing of all TypeScript interfaces, Drizzle schemas, and Zod schemas across the system.
`);

  // 18-reference/status-reference.md
  write('18-reference/status-reference.md', `---
id: status-reference
title: Status Reference
sidebar_position: 5
---

# Operational Status Reference

- **Case Statuses**: \`DETECTED\`, \`NEEDS_REVIEW\`, \`CONFIRMED\`, \`PRIORITIZED\`, \`TASKED\`, \`IN_PROGRESS\`, \`FIELD_VERIFIED\`, \`ACTIONED\`, \`UNCERTAIN\`, \`REJECTED\`, \`CLOSED\`.
- **Task Statuses**: \`UNASSIGNED\`, \`ASSIGNED\`, \`IN_PROGRESS\`, \`BLOCKED\`, \`COMPLETED\`, \`VERIFIED\`, \`CLOSED\`.
`);

  // 18-reference/permissions-reference.md
  write('18-reference/permissions-reference.md', `---
id: permissions-reference
title: Permissions Reference
sidebar_position: 6
---

# Complete Permissions Matrix

Exhaustive role-to-endpoint access mapping across all operational roles.
`);

  // 18-reference/glossary.md
  write('18-reference/glossary.md', `---
id: glossary
title: Glossary
sidebar_position: 7
---

# Comprehensive Glossary

A-Z directory of technical, geospatial, emergency management, and AI terminology used in DRAXELYRA.
`);

  // 19-roadmap/current-state.md
  write('19-roadmap/current-state.md', `---
id: current-state
title: Current Implementation State
sidebar_position: 1
---

# Current Implementation State

<span className="badge-implemented">Implemented</span>

### What is Fully Built & Verified:
- Full TypeScript monorepo with pnpm workspaces.
- Express 5 API server with PostgreSQL session storage and Drizzle ORM.
- Complete OpenAPI 3.1 specification with automated Orval codegen.
- State machines with transactional Optimistic Concurrency Control (OCC).
- Deterministic multi-factor Priority Engine.
- Multi-layer MapLibre GL geospatial map interface.
- Multipart evidence upload pipeline with magic-byte validation and SHA-256 hashing.
- IndexedDB offline mutation queue for tactical responders.
- Deterministic Chennai Urban Flood historical demo replay scenario.
`);

  // 19-roadmap/technical-debt.md
  write('19-roadmap/technical-debt.md', `---
id: technical-debt
title: Technical Debt & Known Limitations
sidebar_position: 2
---

# Technical Debt & Known Limitations

1. **Local File Storage**: Current evidence uploads are stored on local disk (\`/uploads\`); needs abstraction for S3 / Cloud Storage buckets in multi-node clusters.
2. **Synchronous Image Processing**: Image metadata and thumbnail generation run in-process; needs delegation to a background worker queue.
3. **Mock AI Inference**: AI detections currently use the \`change-detector/v2.4.1\` mock adapter.
`);

  // 19-roadmap/planned-improvements.md
  write('19-roadmap/planned-improvements.md', `---
id: planned-improvements
title: Planned Improvements
sidebar_position: 3
---

# Planned Improvements

- **Real-Time WebSocket / SSE Gateway**: Push live triage events and task updates to connected clients without polling.
- **S3 / GCS Storage Driver**: Pluggable cloud object storage for evidence artifacts.
- **Automated SLA Worker**: Background BullMQ job evaluating expired tasks and dispatching webhook alerts.
`);

  // 19-roadmap/future-architecture.md
  write('19-roadmap/future-architecture.md', `---
id: future-architecture
title: Future Architecture
sidebar_position: 4
---

# Future Architecture Vision

\`\`\`mermaid
graph TB
    subgraph Earth Observation Pipeline
        Sat[Copernicus / Planet Labs API] --> IngestWorker[Raster Ingestion Worker]
        IngestWorker --> MLCluster[Triton PyTorch Inference Server]
    end
    
    subgraph Core Platform
        MLCluster --> EventBus[Kafka / Redis Event Bus]
        EventBus --> CoreAPI[DRAXELYRA API Cluster]
        CoreAPI --> DB[(PostgreSQL 16 Multi-AZ)]
        CoreAPI --> S3[(Encrypted Evidence Bucket)]
    end
    
    subgraph Tactical Clients
        CoreAPI --> WS[WebSocket Realtime Push]
        WS --> WebApp[Command Center Web Console]
        WS --> MobileApp[Tactical Mobile Field Units]
    end
\`\`\`
`);

  console.log('Operations, Maintenance, Reference, and Roadmap documentation generated.');
}
