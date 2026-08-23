import fs from 'node:fs';
import path from 'node:path';

export function generateApiTesting(docsDir) {
  const write = (relPath, content) => {
    const fullPath = path.join(docsDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  };

  write('11-api/overview.md', `
# API Reference Overview
<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend provides a strictly-typed RESTful API designed for reliability and audibility in high-stress operational environments.

## Core Principles

- **Predictable Error Handling:** All errors return a standard JSON envelope with an explicit HTTP status code.
- **Strict Validation:** Incoming payloads are validated using \`Zod\` schemas shared between the client and server via the \`@workspace/api-zod\` package.
- **Stateless/Stateful Hybrid:** Authentication relies on stateful HTTP-only cookies, but endpoints are structurally stateless.

## Standard Error Codes

The system relies on a unified subset of HTTP status codes:

| Code | Status | Meaning |
|---|---|---|
| **400** | \`BAD_REQUEST\` | Payload failed Zod validation or was malformed. |
| **401** | \`UNAUTHORIZED\` | Missing or invalid session cookie. |
| **403** | \`FORBIDDEN\` | Authenticated, but lacks required Role-Based Access Control (RBAC) permissions. |
| **404** | \`NOT_FOUND\` | The requested resource does not exist. |
| **409** | \`VERSION_CONFLICT\` | Optimistic concurrency check failed (ETag/Version mismatch). |
| **422** | \`INVALID_TRANSITION\` | Attempted to move a case or task to an illogical state machine phase. |
| **500** | \`SERVER_ERROR\` | Unhandled backend exception. |

## Request Validation

**Source File:** \`backend/src/middleware/validate.ts\`

\`\`\`typescript
export const validateBody = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res.status(400).json({ error: 'BAD_REQUEST', details: error.errors });
    }
  };
\`\`\`
  `);

  write('11-api/endpoints.md', `
# Endpoints Reference
<span className="badge-implemented">Implemented</span>

Comprehensive reference of available DRAXELYRA REST API endpoints.

## Auth

- \`POST /api/auth/login\`
  - Payload: \`{ email, password }\`
  - Action: Verifies via bcrypt, establishes session. Returns user object (excludes passwordHash).
  - Errors: 400, 401, 500
- \`POST /api/auth/logout\`
  - Requires: Authentication
  - Action: \`session.destroy()\`. Returns \`{ success: true }\`
- \`GET /api/auth/me\`
  - Requires: Authentication
  - Action: Retrieves user via \`session.userId\`. Errors: 404.

## Incidents

- \`GET /api/incidents\`
  - Requires: Authentication
  - Action: Returns all incidents ordered by \`updatedAt\` descending.
- \`POST /api/incidents\`
  - Requires: Roles \`[System Admin, Organization Admin, Disaster Officer]\`
  - Action: Provisions a new incident workspace.
- \`GET /api/incidents/:id\`
  - Requires: Authentication
  - Action: Returns incident details. Automatically falls back to Demo incident if standard lookup fails.
- \`PATCH /api/incidents/:id\`
  - Requires: Roles \`[System Admin, Organization Admin, Disaster Officer]\`
  - Action: Updates status, description, or severity.
- \`GET /api/incidents/:id/map\`
  - Requires: Authentication
  - Action: Returns aggregated GeoJSON (\`aoi\`, \`cases\`, \`criticalAssets\`, \`detections\`, \`fieldObservations\`).

## Cases

- \`GET /api/cases\`
  - Requires: Authentication
  - Action: Returns cases joined with related detections and critical assets. Ordered by \`priorityScore\` descending.
- \`GET /api/cases/:id\`
  - Requires: Authentication
  - Action: Detailed case record including pre/post disaster imagery dates.
- \`POST /api/cases/:id/review\`
  - Requires: Roles \`[System Admin, Organization Admin, Disaster Officer, Manager, Analyst, Commander]\`
  - Payload: \`{ decision, notes, version }\` (decision: confirmed/rejected/uncertain)
  - Action: Transitions state machine, recalculates priority if confirmed.
  - Returns: \`{ success, newStatus, priorityScore, version }\`
  - Errors: 409 VERSION_CONFLICT, 422 INVALID_TRANSITION
- \`GET /api/cases/:id/audit\`
  - Requires: All Roles
  - Action: Returns immutable audit events with actor names.

## Tasks

- \`GET /api/tasks\`
  - Requires: Authentication
  - Action: Lists tasks, calculating SLA labels and escalation flags dynamically.
- \`POST /api/tasks\`
  - Requires: Roles \`[System Admin, Organization Admin, Disaster Officer, Manager, Commander, Response Coordinator]\`
  - Action: Creates a task, auto-transitions parent case to \`TASKED\`.
  - SLA Calculation: priority >= 75 → 30min; >= 45 → 2h; else → 8h.
- \`PATCH /api/tasks/:id\`
  - Requires: Roles \`[System Admin, Organization Admin, Disaster Officer, Manager, Commander, Field Responder]\`
  - Payload: \`{ status, version }\`
  - Action: State machine transition. If status equals \`VERIFIED\`, auto-transitions parent case to \`FIELD_VERIFIED\`.

## Evidence & Uploads

- \`POST /api/evidence/upload\`
  - Requires: Authentication
  - Content-Type: \`multipart/form-data\`
  - Action: Performs MIME check, magic bytes validation, SHA-256 hashing, and prevents path traversal before committing to disk and DB.

## Analytics & Operations

- \`GET /api/analytics/overview\`
  - Requires: Authentication
  - Action: Returns system KPIs (cases total, needs_review, confirmed, rejected, uncertain, closed, falsePositiveRate, tasksOpen, completed, overdue, SLA compliance, scatter data, funnel, timelines).
- \`GET /api/command/summary\`
  - Requires: Authentication
  - Action: Fast, cached read of active incident metrics, top 5 highest priority cases, top 5 tasks, and 5 recent audit events.
- \`POST /api/audit\`
  - Requires: Authentication
  - Action: Inserts custom application-level audit events.

## System & Demo

- \`POST /api/demo/load\`
  - Requires: Authentication
  - Action: **DESTRUCTIVE.** Purges all operational tables and seeds the demo environment (users, incident, assets, detections, hero case).
- \`POST /api/demo/reset\`
  - Requires: Authentication
  - Action: Convenience wrapper; redirects to \`/api/demo/load\`.
- \`GET /api/healthz\`
  - Action: Returns \`{ status: 'ok' }\`. Unauthenticated liveness probe.
  `);

  write('12-testing/testing.md', `
# Testing Infrastructure
<span className="badge-implemented">Implemented</span>

The DRAXELYRA platform enforces quality and reliability through rigorous unit testing (Vitest) and end-to-end testing.

## Unit Testing

The priority scoring algorithm is critical to life-safety operations. It is heavily tested using Vitest to ensure deterministic outputs.

**Source File:** \`backend/tests/priority.test.ts\`

\`\`\`typescript
import { calculatePriority } from '../src/utils/priority';
import { describe, it, expect } from 'vitest';

describe('Priority Algorithm', () => {
  it('calculates canonical High Priority asset accurately', () => {
    const score = calculatePriority({
      damageClass: 'Severe',
      assetType: 'Hospital',
      populationDensity: 'High',
      hoursSinceIncident: 28.8,
      criticalInfrastructure: true,
      aiConfidence: 0.55
    });
    
    // Despite 55% AI confidence, severity + hospital + infra heavily boosts score
    expect(score).toBe(83);
  });
});
\`\`\`

## End-to-End Testing

The E2E suite verifies the complete happy-path of the application, from analyst login through field task verification.

**Source File:** \`tests/test-e2e.js\`

### Core Workflow Validated:
1. **Authentication:** Logs in using standard analyst credentials.
2. **Environment Reset:** Hits \`/api/demo/load\` to guarantee a clean, known state.
3. **Data Verification:** Fetches "Hero" Case \`C-1048\` and asserts the calculated priority is precisely \`83\`.
4. **Analyst Review:** Submits a \`CONFIRMED\` review decision via \`POST /api/cases/C-1048/review\`.
5. **Audit Trail Verification:** Validates that the review transition successfully appended immutable records to the audit log.
  `);

  write('13-security/security.md', `
# Security Architecture
<span className="badge-implemented">Implemented</span>

The platform handles highly sensitive tactical data and enforces strict access controls and data validation.

## Session Management

- **Provider:** HTTP-Only Cookies managed via \`connect-pg-simple\` (PostgreSQL session store).
- **Hardening:** \`secure\` flag enforced in production; sessions hard-expire after a 30-day \`maxAge\`.
- **Passwords:** Bcrypt is used for all password hashing. Raw passwords are never stored or logged.

## Role-Based Access Control (RBAC)

Access is gatekept by dual middleware functions:
1. \`requireAuth\`: Verifies the presence and integrity of the session cookie.
2. \`requireRole(roles[])\`: Asserts that the authenticated user's assigned role is within the permitted array.

\`\`\`typescript
// Example from tasks router
router.post('/', requireRole(['System Admin', 'Commander', 'Response Coordinator']), createTask);
\`\`\`

## File Upload Security

Field responders frequently upload imagery from untrusted environments. The upload pipeline (\`/api/evidence/upload\`) enforces:

1. **MIME Whitelist:** Only images and short videos are accepted.
2. **Magic Bytes Validation:** Files are deeply inspected to ensure headers match the extension:
   - JPEG: \`FF D8 FF\`
   - PNG: \`89 50 4E 47\`
   - WEBP: \`RIFF\` ... \`WEBP\`
   - MP4: \`ftyp\`
3. **Size Constraints:** Hard limit of 50MB per payload.
4. **Integrity:** SHA-256 checksums are generated and stored upon disk write.
5. **Path Traversal:** File names are sanitized and generated server-side to prevent directory traversal exploits.

## Observability & Redaction

**Source File:** \`backend/src/utils/logger.ts\`

The platform uses Pino for high-performance structured logging. To prevent credentials and session hijacking tokens from leaking into external aggregation services, the logger is configured with strict redaction paths:

\`\`\`typescript
const logger = pino({
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'body.password'
  ]
});
\`\`\`

## Audit Trail

The database schema includes an \`audit_events\` table. This table is strictly append-only. Backend state machine transitions automatically generate localized context events, guaranteeing an unalterable operational history for post-disaster reviews.
  `);
}
