import fs from 'fs';
import path from 'path';

export function generateOpsRef(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 15-deployment/local.md
  write('15-deployment/local.md', `# Local Deployment Guide

<span className="badge-implemented">Implemented</span>

Local deployment runs PostgreSQL via Docker Compose, Express backend on port 5000, and Vite frontend on port 5173.

\`\`\`bash
# 1. Start database
docker compose up -d

# 2. Push schema
pnpm --filter @workspace/db run push

# 3. Start development servers
pnpm run dev
\`\`\`
`);

  // 15-deployment/docker.md
  write('15-deployment/docker.md', `# Docker & Compose Architecture

<span className="badge-implemented">Implemented</span>

The \`docker-compose.yml\` configuration:

\`\`\`yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: draxelyra-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: draxelyra
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
\`\`\`
`);

  // 15-deployment/replit.md
  write('15-deployment/replit.md', `# Cloud Sandbox Deployment

<span className="badge-implemented">Implemented</span>

Configured for unified reverse-proxy execution where Express serves both API routes and static frontend bundles.
`);

  // 15-deployment/production.md
  write('15-deployment/production.md', `# Production Deployment

<span className="badge-implemented">Implemented</span>

In production:
1. Express API server runs behind an Nginx or Cloudflare reverse proxy with TLS termination.
2. Production builds:
   - Backend: \`artifacts/api-server/dist/index.cjs\`
   - Frontend: \`artifacts/draxelyra/dist/public/\`
3. PostgreSQL connection pool configured for high concurrency.
`);

  // 15-deployment/database-deployment.md
  write('15-deployment/database-deployment.md', `# Database Provisioning & High Availability

<span className="badge-implemented">Implemented</span>

Production database checklist:
- Enable SSL/TLS connections (\`sslmode=require\`).
- Automated daily pg_dump backups.
- Connection limits tuned for container resources.
`);

  // 15-deployment/environment-management.md
  write('15-deployment/environment-management.md', `# Environment Management

<span className="badge-implemented">Implemented</span>

Separate environments (\`development\`, \`staging\`, \`production\`) using scoped \`.env\` configurations and secret managers.
`);

  // 15-deployment/backups.md
  write('15-deployment/backups.md', `# Backup & Disaster Recovery

<span className="badge-implemented">Implemented</span>

Automated backup scripts for PostgreSQL and uploaded media artifacts in \`uploads/\`.
`);

  // 15-deployment/monitoring.md
  write('15-deployment/monitoring.md', `# Monitoring & Telemetry

<span className="badge-implemented">Implemented</span>

- Healthcheck endpoint: \`GET /api/health\`
- Structured JSON logging: **Pino** output stream
- Uptime SLA monitoring on key REST endpoints
`);

  // 16-maintenance/troubleshooting.md
  write('16-maintenance/troubleshooting.md', `# Troubleshooting Runbook

<span className="badge-implemented">Implemented</span>

### Common Operational Issues

1. **Database Connection Refused**:
   - Verify PostgreSQL container is running: \`docker compose ps\`
   - Check \`DATABASE_URL\` matches port \`5433\`.
2. **Session Expired / 401 Unauthorized**:
   - Clear browser cookies and re-authenticate at \`/login\`.
3. **409 Version Conflict on Case Review**:
   - Another operator modified the case. Refresh the page to load the updated entity version before resubmitting.
`);

  // 16-maintenance/debugging.md
  write('16-maintenance/debugging.md', `# Debugging & Diagnostics

<span className="badge-implemented">Implemented</span>

Use \`LOG_LEVEL=debug\` in \`.env\` for detailed Pino request/response dumps.
`);

  // 16-maintenance/logging.md
  write('16-maintenance/logging.md', `# Structured Logging with Pino

<span className="badge-implemented">Implemented</span>

Pino logs JSON payloads with \`reqId\`, \`method\`, \`url\`, \`responseTime\`, and error stack traces.
`);

  // 16-maintenance/common-errors.md
  write('16-maintenance/common-errors.md', `# Common Error Signatures

<span className="badge-implemented">Implemented</span>

Catalog of common error responses and recommended recovery steps.
`);

  // 16-maintenance/dependency-updates.md
  write('16-maintenance/dependency-updates.md', `# Dependency Maintenance

<span className="badge-implemented">Implemented</span>

- Supply chain verification: \`pnpm-workspace.yaml\` enforces 24h package release age.
- Update dependencies: \`pnpm update\`.
`);

  // 16-maintenance/database-recovery.md
  write('16-maintenance/database-recovery.md', `# Database Recovery Procedures

<span className="badge-implemented">Implemented</span>

Standard procedure for restoring PostgreSQL backups using \`pg_restore\`.
`);

  // 17-contributing/development-workflow.md
  write('17-contributing/development-workflow.md', `# Development Workflow

<span className="badge-implemented">Implemented</span>

1. OpenAPI-First: Modify \`lib/api-spec/openapi.yaml\`.
2. Generate types: \`pnpm --filter @workspace/api-spec run codegen\`.
3. Implement backend route handler and service logic.
4. Build frontend React components and query hooks.
5. Verify tests: \`pnpm test\`.
`);

  // 17-contributing/code-style.md
  write('17-contributing/code-style.md', `# Code Style & Standards

<span className="badge-implemented">Implemented</span>

TypeScript strict mode, ESLint, Prettier formatting, and conventional commit messages.
`);

  // 17-contributing/branching.md
  write('17-contributing/branching.md', `# Git Branching Model

<span className="badge-implemented">Implemented</span>

- \`main\`: Production-ready branch.
- Feature branches: \`feat/feature-name\`, \`fix/bug-name\`.
- Documentation: \`docs/doc-name\`.
`);

  // 17-contributing/pull-requests.md
  write('17-contributing/pull-requests.md', `# Pull Request Guidelines

<span className="badge-implemented">Implemented</span>

Every PR must pass TypeScript typechecks, Vitest unit tests, and Docusaurus documentation builds.
`);

  // 17-contributing/commit-conventions.md
  write('17-contributing/commit-conventions.md', `# Commit Conventions

<span className="badge-implemented">Implemented</span>

Conventional Commits standard: \`feat:\`, \`fix:\`, \`docs:\`, \`chore:\`, \`refactor:\`, \`test:\`.
`);

  // 17-contributing/adding-features.md
  write('17-contributing/adding-features.md', `# Adding Features Walkthrough

<span className="badge-implemented">Implemented</span>

Step-by-step example of adding a new disaster hazard type or API route to the monorepo.
`);

  // 18-reference/configuration.md
  write('18-reference/configuration.md', `# Configuration Reference

<span className="badge-implemented">Implemented</span>

Complete reference of monorepo config files (\`pnpm-workspace.yaml\`, \`drizzle.config.ts\`, \`vite.config.ts\`, \`docusaurus.config.ts\`).
`);

  // 18-reference/environment-reference.md
  write('18-reference/environment-reference.md', `# Environment Variables Reference

<span className="badge-implemented">Implemented</span>

All supported environment variables with defaults and descriptions.
`);

  // 18-reference/api-reference.md
  write('18-reference/api-reference.md', `# API Quick Reference Table

<span className="badge-implemented">Implemented</span>

Exhaustive table mapping all REST endpoints, methods, and role requirements.
`);

  // 18-reference/data-model-reference.md
  write('18-reference/data-model-reference.md', `# Data Model Reference

<span className="badge-implemented">Implemented</span>

Comprehensive entity-relationship catalog.
`);

  // 18-reference/status-reference.md
  write('18-reference/status-reference.md', `# Status Reference

<span className="badge-implemented">Implemented</span>

Complete matrix of all Case states, Task states, Incident states, and Review states.
`);

  // 18-reference/permissions-reference.md
  write('18-reference/permissions-reference.md', `# Permissions Reference

<span className="badge-implemented">Implemented</span>

Detailed role-to-permission mapping table across all system actions.
`);

  // 18-reference/glossary.md
  write('18-reference/glossary.md', `# Glossary of Terms

<span className="badge-implemented">Implemented</span>

Standardized definitions for disaster management and software engineering terms.
`);

  // 19-roadmap/current-state.md
  write('19-roadmap/current-state.md', `# Current Implementation State

<span className="badge-implemented">Implemented</span>

DRAXELYRA is fully operational with a complete monorepo, OpenAPI contract, Drizzle PostgreSQL schema, state machines with OCC, MapLibre GL mapping, IndexedDB offline sync, and a deterministic scenario replay dataset.
`);

  // 19-roadmap/technical-debt.md
  write('19-roadmap/technical-debt.md', `# Technical Debt & Codebase Maintenance

<span className="badge-implemented">Implemented</span>

Identifies areas for refactoring (e.g. modularizing \`App.tsx\` sub-views, expanding automated test coverage).
`);

  // 19-roadmap/planned-improvements.md
  write('19-roadmap/planned-improvements.md', `# Planned Improvements

<span className="badge-planned">Planned Future Architecture</span>

- Real-time WebSocket event streaming.
- Redis / BullMQ worker queue for async task processing.
- Live satellite orbital tasking adapters (Sentinel-2, Planet Labs).
`);

  // 19-roadmap/future-architecture.md
  write('19-roadmap/future-architecture.md', `# Future Architecture Vision

<span className="badge-planned">Planned Future Architecture</span>

Vision for distributed edge deployments in disaster zones with mesh networking and drone video object detection.
`);
}
