import fs from 'fs';
import path from 'path';

export function generateOpsRef(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  const deploymentContent = `
# Deployment Architecture and Strategies

<span className="badge-implemented">Implemented</span>

The DRAXELYRA platform is designed to be deployed across a variety of environments ranging from local development machines to scalable production clusters. This document details the infrastructure requirements, configuration variables, and procedural steps for deploying the DRAXELYRA platform.

## Infrastructure Architecture

At its core, the platform follows a modular monolith approach wrapped in a workspace-based monorepo. The primary services include:
1.  **API Server (Backend)**: Express 5.2 application providing the core REST capabilities and database interactions.
2.  **Web Client (Frontend)**: React 19 application built via Vite.
3.  **PostgreSQL Database**: Persistent storage for all entities.

\`\`\`mermaid
graph TD
    Client[Web Browser] -->|HTTPS| Proxy[Reverse Proxy / Ingress]
    Proxy -->|Static Assets| Static[Static File Server]
    Proxy -->|/api/*| Express[Express API Server]
    Express -->|TCP/5432| Postgres[(PostgreSQL 15)]
\`\`\`

## Local Development Deployment

For local development, the platform utilizes Docker Compose to manage dependencies (like PostgreSQL) while running the application services directly on the host using \`pnpm\`.

### Docker Compose Configuration

File: \`docker-compose.yml\`

\`\`\`yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: draxelyra-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: draxelyra
    ports: ["5433:5432"]
    volumes: [postgres-data:/var/lib/postgresql/data]
    restart: unless-stopped
volumes:
  postgres-data:
\`\`\`

### Startup Procedure

1.  **Initialize Database Services**:
    \`\`\`bash
    docker compose up -d
    \`\`\`
2.  **Migrate Schema**:
    Push the Drizzle ORM schema to the active database instance.
    \`\`\`bash
    pnpm --filter @workspace/db run push
    \`\`\`
3.  **Start Development Server**:
    Launch the Vite development server and the backend API server concurrently.
    \`\`\`bash
    pnpm run dev
    \`\`\`

### Dev Server Proxy Setup

During development, the Vite server operates on port \`5173\` and proxies all requests prefixed with \`/api\` to the Express server running on port \`3000\`. This bypasses CORS issues and perfectly mimics production routing behavior.

File: \`artifacts/draxelyra/vite.config.ts\`
\`\`\`typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
\`\`\`

## Production Deployment

Production deployments bundle the frontend into static assets and compile the backend into a lightweight Node.js executable script.

### Build Process

The production build step executes across all workspace packages:

\`\`\`bash
pnpm build
\`\`\`

1.  **Backend Target**: \`artifacts/api-server/dist/index.mjs\` (bundled via esbuild).
2.  **Frontend Target**: \`artifacts/draxelyra/dist/public/\` (bundled via Vite).

In production, the Express backend serves the static frontend assets from the \`public\` directory, simplifying deployment down to a single Node.js process and a PostgreSQL database.

### Environment Configuration

The following environment variables govern the deployment:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| \`DATABASE_URL\` | PostgreSQL connection string | Yes | - |
| \`PORT\` | Server port (validated > 0) | Yes | \`3000\` |
| \`SESSION_SECRET\` | Express session cryptographic secret | No | \`draxelyra_default_secret\` |
| \`NODE_ENV\` | Application environment flag | No | \`development\` |
| \`LOG_LEVEL\` | Pino logger verbosity level | No | \`info\` |
| \`VITE_PORT\` | Vite development server port | No | \`5173\` |
| \`BASE_PATH\` | Frontend base routing path | No | \`/\` |

### Cloud / Replit Deployment

When deploying to PaaS providers (like Replit or Render), the platform utilizes a reverse proxy configured by the provider. Ensure that \`DATABASE_URL\` points to a managed PostgreSQL instance and that the start command triggers \`node artifacts/api-server/dist/index.mjs\`.
  `;

  const operationsContent = `
# System Operations and Maintenance

<span className="badge-implemented">Implemented</span>

Maintaining the DRAXELYRA platform involves monitoring system health, managing the monorepo workspace, and utilizing standardized troubleshooting procedures to resolve common operational issues.

## Monorepo Architecture

The codebase is organized using \`pnpm\` workspaces, explicitly separating operational artifacts from shared libraries.

File: \`pnpm-workspace.yaml\`
\`\`\`yaml
packages:
  - "artifacts/*"
  - "lib/*"
\`\`\`

### Directory Structure

\`\`\`text
DRAXELYRA-Response-OS/
├── artifacts/
│   ├── api-server/         # Express 5 backend executable
│   └── draxelyra/          # React 19 + Vite frontend
├── lib/
│   ├── db/                 # Drizzle ORM models and PostgreSQL schemas
│   ├── api-spec/           # Central OpenAPI 3.1 YAML definition
│   ├── api-zod/            # Generated Zod validation schemas
│   └── api-client-react/   # Generated TanStack Query hooks
\`\`\`

This modularity ensures that the backend and frontend are tightly coupled via generated API client code but decoupled in their specific operational lifecycles.

## Observability and Logging

The system relies on \`pino\` for high-performance, low-overhead logging.

- **Level Configuration**: Controlled via the \`LOG_LEVEL\` environment variable. The default is \`info\`. Available levels: \`fatal\`, \`error\`, \`warn\`, \`info\`, \`debug\`, \`trace\`.
- **Development Output**: Utilizes \`pino-pretty\` to output formatted, color-coded logs to standard output.
- **Production Output**: Emits raw JSON streams suitable for ingestion by platforms like Datadog, ELK stack, or CloudWatch.

### Redaction Rules

To maintain security compliance, the logger automatically redacts sensitive headers in all incoming requests and outgoing responses.

File: \`artifacts/api-server/src/logger.ts\`
\`\`\`typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]'
  ]
});
\`\`\`

## Troubleshooting Playbook

### 1. Database Connection Refused

**Symptoms:**
Logs output \`error: connection to server at "localhost" (::1), port 5433 failed: Connection refused\`.

**Resolution Steps:**
1. Check running Docker containers: \`docker compose ps\`
2. Verify the port mappings. The local development database is mapped to \`5433\` (to avoid conflicts with standard local postgres on \`5432\`).
3. Ensure \`DATABASE_URL\` points to \`postgresql://postgres:postgres@localhost:5433/draxelyra\`.

### 2. 401 Unauthorized API Responses

**Symptoms:**
The frontend fails to fetch data with a \`401\` status code logged in the network tab.

**Resolution Steps:**
1. The session may have expired. Force a clear of local storage and cookies in the browser.
2. Re-authenticate via the login interface.
3. If the problem persists, verify the \`SESSION_SECRET\` matches across deployments if operating behind a load balancer.

### 3. 409 Version Conflict (Optimistic Concurrency)

**Symptoms:**
Updating an entity (like a Case or Task) yields a \`409 Conflict\`.

**Resolution Steps:**
1. This is an expected operational constraint enforcing optimistic concurrency control.
2. The client must re-fetch the latest entity state to acquire the current version number before re-attempting the mutation.

### 4. Drizzle Schema Push Fails

**Symptoms:**
\`pnpm --filter @workspace/db run push\` exits with code 1.

**Resolution Steps:**
1. Confirm the \`DATABASE_URL\` environment variable is exported in the current shell.
2. Ensure the postgres container is actually healthy.
  `;

  const contributingContent = `
# Contributing Guidelines

<span className="badge-implemented">Implemented</span>

This document outlines the standard workflows, architecture patterns, and technical stacks required for contributing to the DRAXELYRA platform. We adhere to a strict API-first, contract-driven development process.

## The OpenAPI-First Workflow

All feature development that involves client-server communication must begin with the OpenAPI specification. This ensures both frontend and backend teams have a unified contract.

\`\`\`mermaid
sequenceDiagram
    participant Dev as Developer
    participant Spec as OpenAPI YAML
    participant CodeGen as Codegen Tools
    participant FE as Frontend
    participant BE as Backend

    Dev->>Spec: 1. Update openapi.yaml
    Dev->>CodeGen: 2. pnpm --filter @workspace/api-spec run codegen
    CodeGen-->>FE: Generates React Query Hooks
    CodeGen-->>BE: Generates Zod Schemas
    Dev->>BE: 3. Implement Express Route
    Dev->>FE: 4. Build React Components
\`\`\`

### Step-by-step Workflow

1.  **Edit the API Specification**:
    Navigate to \`lib/api-spec/openapi.yaml\` and define the new endpoints, request bodies, and response definitions using OpenAPI 3.1 syntax.
2.  **Run Code Generation**:
    Execute the generation script to create Zod schemas and TanStack Query hooks.
    \`\`\`bash
    pnpm --filter @workspace/api-spec run codegen
    \`\`\`
3.  **Backend Implementation**:
    In \`artifacts/api-server\`, create or modify the route handlers. Utilize the newly generated Zod schemas from \`@workspace/api-zod\` to validate incoming requests.
4.  **Frontend Implementation**:
    In \`artifacts/draxelyra\`, import the generated TanStack hooks from \`@workspace/api-client-react\` to bind data to your UI components.
5.  **Run Tests**:
    Ensure all components remain functional.
    \`\`\`bash
    pnpm test
    \`\`\`

## Technical Stack Reference

Ensure your local development environment supports the following technologies before contributing:

*   **Runtime**: Node.js 20+ with TypeScript 5.x.
*   **Backend Ecosystem**:
    *   Framework: Express 5.2
    *   Database Toolkit: Drizzle ORM
    *   Database: PostgreSQL 15
    *   Bundler: esbuild
*   **Frontend Ecosystem**:
    *   Framework: React 19
    *   Build Tool: Vite 6
    *   Routing: Wouter 3
    *   Data Fetching: TanStack Query (auto-generated)
    *   Mapping: MapLibre GL
    *   Styling: Tailwind CSS 4, Radix UI Primitives
*   **Testing Framework**: Vitest
*   **Package Manager**: pnpm (Workspaces)

## Commit and Review Process

*   Prefix commits with conventional tags (e.g., \`feat:\`, \`fix:\`, \`chore:\`, \`docs:\`).
*   Ensure \`pnpm run build\` and \`pnpm test\` pass cleanly before requesting a review.
*   Never manually modify files in \`lib/api-zod/\` or \`lib/api-client-react/\`. These are strictly generated artifacts.
  `;

  const referenceContent = `
# Core Systems Reference

<span className="badge-implemented">Implemented</span>

This reference manual documents the exhaustive list of enumerations, strict data statuses, and authorization matrices utilized across the DRAXELYRA operating environment.

## Status Enumerable Values

The platform strictly tracks states using explicit enumerable fields. All state transitions must adhere to these sets.

### Case Statuses
- \`DETECTED\`: Initial system or user identification.
- \`NEEDS_REVIEW\`: Requires human verification.
- \`CONFIRMED\`: Validation passed, case is active.
- \`REJECTED\`: Marked as invalid or non-actionable.
- \`UNCERTAIN\`: Insufficient data to verify.
- \`PRIORITIZED\`: Escalated for immediate attention.
- \`TASKED\`: Action items generated and dispatched.
- \`IN_PROGRESS\`: Active mitigation underway.
- \`FIELD_VERIFIED\`: Ground truth confirmed by field ops.
- \`ACTIONED\`: Direct intervention applied.
- \`CLOSED\`: Case concluded.

### Task Statuses
- \`UNASSIGNED\`: Pending resource allocation.
- \`ASSIGNED\`: Personnel allocated, awaiting acknowledgment.
- \`IN_PROGRESS\`: Task execution active.
- \`BLOCKED\`: Execution halted due to external dependencies.
- \`COMPLETED\`: Execution finished.
- \`VERIFIED\`: Completion confirmed by oversight.
- \`CLOSED\`: Final archival state.

### Review Statuses
- \`PENDING\`: Awaiting intelligence review.
- \`CONFIRMED\`: Intelligence validated.
- \`REJECTED\`: Intelligence discarded.
- \`UNCERTAIN\`: Requires further corroboration.

### Incident Statuses
- \`Active\`: Incident requires ongoing management.
- \`Closed\`: Incident is resolved.

## Role-Based Access Control (RBAC) Permissions Matrix

Security is enforced via granular endpoint authorizations mapping to predefined organizational roles.

| Endpoint | System Admin | Org Admin | Commander | Disaster Officer | Manager | Analyst | Field Responder |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| \`POST /incidents\` | ✓ | ✓ | — | ✓ | — | — | — |
| \`PATCH /incidents/:id\` | ✓ | ✓ | — | ✓ | — | — | — |
| \`POST /cases/:id/review\` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| \`GET /cases/:id/audit\` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| \`POST /tasks\` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| \`PATCH /tasks/:id\` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| \`POST /evidence/upload\` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| \`POST /demo/load\` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Environment Variables Reference

| Variable | Usage Context | Type | Description |
|----------|---------------|------|-------------|
| \`DATABASE_URL\` | Backend | String | Standard libpq connection string. Example: \`postgresql://user:pass@host:5432/db\` |
| \`PORT\` | Backend | Integer | Binding port for the Express HTTP server. |
| \`SESSION_SECRET\` | Backend | String | Cryptographic key for signing session cookies. Must be rotated regularly in prod. |
| \`LOG_LEVEL\` | Universal | Enum | Specifies Pino's minimum output severity. |
| \`VITE_PORT\` | Frontend | Integer | Port utilized by the Vite HMR server in local development. |
| \`BASE_PATH\` | Frontend | String | Application routing root (useful for sub-directory deployments). |
| \`NODE_ENV\` | Universal | String | Enables framework-specific production optimizations when set to \`production\`. |
  `;

  const roadmapContent = `
# Platform Roadmap

<span className="badge-planned">Planned</span>

The DRAXELYRA platform is under continuous active development. The roadmap outlines strategic architectural enhancements and functional expansions designed to scale the system for larger, concurrent disaster intelligence workflows.

## Upcoming Architectural Enhancements

### 1. Offline-First Synchronization
Implementation of local-first data caching utilizing RxDB or WatermelonDB to allow Field Responders to execute tasks and capture evidence without persistent network connectivity, synchronizing payloads when connectivity is restored.

### 2. Real-time Telemetry Services
Migration from standard HTTP polling to WebSocket/SSE streams for live tactical map updates, reducing database query overhead and providing sub-second latency for resource tracking.

### 3. Federated Authentication
Integration of OIDC (OpenID Connect) and SAML 2.0 to support SSO (Single Sign-On) against existing enterprise directories (e.g., Azure AD, Okta), critical for rapid inter-agency onboarding.

### 4. Machine Learning Ingestion Pipeline
Establishing a dedicated gRPC microservice to handle asynchronous analysis of uploaded evidence, automatically tagging media and drafting preliminary Review cases for human verification.
  `;

  write('14-deployment/deployment.md', deploymentContent);
  write('15-maintenance/operations.md', operationsContent);
  write('16-contributing/contributing.md', contributingContent);
  write('17-reference/reference.md', referenceContent);
  write('18-roadmap/roadmap.md', roadmapContent);
}
