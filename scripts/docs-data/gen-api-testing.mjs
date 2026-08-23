import fs from 'fs';
import path from 'path';

export function generateApiTesting(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 12-api/overview.md
  write('12-api/overview.md', `---
id: overview
title: API Overview
sidebar_position: 1
---

# API Overview & Base Conventions

<span className="badge-implemented">Implemented</span>

The DRAXELYRA API is an OpenAPI 3.1-compliant REST service mounted at \`/api\`.

- **Base URL**: \`/api\`
- **Data Format**: JSON (\`application/json\`)
- **Authentication**: HTTP-only Session Cookies (\`connect.sid\`)
- **Specification Source**: \`lib/api-spec/openapi.yaml\`
`);

  // 12-api/authentication.md
  write('12-api/authentication.md', `---
id: authentication
title: Auth Endpoints
sidebar_position: 2
---

# Authentication API Reference

### \`POST /api/auth/login\`
Authenticate with email and password.
- **Request Body**: \`{ "email": "analyst@draxelyra.local", "password": "demo123" }\`
- **Response (200)**: \`{ "id": "usr-analyst", "name": "Alice Analyst", "email": "...", "role": "Analyst" }\`
- **Set-Cookie**: \`connect.sid=<session-id>; Path=/; HttpOnly; SameSite=Lax\`

### \`POST /api/auth/logout\`
Terminates the active session.
- **Response (200)**: \`{ "success": true }\`

### \`GET /api/auth/me\`
Retrieves profile for current session.
- **Response (200)**: \`{ "id": "usr-analyst", "name": "Alice Analyst", "email": "...", "role": "Analyst" }\`
`);

  // 12-api/incidents.md
  write('12-api/incidents.md', `---
id: incidents
title: Incidents API
sidebar_position: 3
---

# Incidents API Reference

### \`GET /api/incidents\`
List all disaster incidents ordered by update time descending.

### \`POST /api/incidents\`
Create a new disaster incident.
- **Permissions**: System Admin, Organization Admin, Disaster Officer
- **Request Body**: \`{ "name": "Skagit Valley Flood", "disasterType": "River Flood", "severity": "high", "aoi": { ... } }\`
- **Response (201)**: \`{ "id": "inc-174000...", "name": "...", ... }\`

### \`GET /api/incidents/:id\`
Retrieve full operational details for an incident.

### \`GET /api/incidents/:id/map\`
Returns aggregated GeoJSON layers (\`aoi\`, \`cases\`, \`criticalAssets\`, \`detections\`, \`fieldObservations\`).
`);

  // 12-api/cases.md
  write('12-api/cases.md', `---
id: cases
title: Cases API
sidebar_position: 4
---

# Cases API Reference

### \`GET /api/cases\`
Returns ranked cases joined with critical assets and detections.

### \`GET /api/cases/:id\`
Retrieves detailed case payload including factor breakdown and imagery dates.

### \`POST /api/cases/:id/review\`
Submit a human review decision.
- **Permissions**: Analyst, Commander, Disaster Officer, Manager, Admin
- **Request Body**: \`{ "decision": "confirmed", "notes": "Ground-floor flood verified", "version": 1 }\`
- **Response (200)**: \`{ "success": true, "newStatus": "CONFIRMED", "priorityScore": 83, "version": 2 }\`
- **Error (409)**: \`{ "error": { "code": "VERSION_CONFLICT", "message": "The record changed on the server." } }\`

### \`GET /api/cases/:id/audit\`
Returns chronological audit events for the specified case.
`);

  // 12-api/tasks.md
  write('12-api/tasks.md', `---
id: tasks
title: Tasks API
sidebar_position: 5
---

# Tasks API Reference

### \`GET /api/tasks\`
List all response tasks with dynamic SLA labels and escalation booleans.

### \`POST /api/tasks\`
Create an action order and transition the parent case to \`TASKED\`.
- **Request Body**: \`{ "caseId": "C-1048", "title": "Check hospital access", "assignedTeam": "Field Team 1", "version": 1 }\`
- **Response (201)**: \`{ "id": "task-174000...", "status": "UNASSIGNED", "priority": 83, ... }\`

### \`PATCH /api/tasks/:id\`
Update task status.
- **Request Body**: \`{ "status": "VERIFIED", "version": 1 }\`
- **Response (200)**: \`{ "success": true, "version": 2 }\`
`);

  // 12-api/evidence.md
  write('12-api/evidence.md', `---
id: evidence
title: Evidence API
sidebar_position: 6
---

# Evidence API Reference

### \`POST /api/evidence/upload\`
Upload a binary media artifact with cryptographic and signature verification.
- **Content-Type**: \`multipart/form-data\`
- **Form Fields**: \`caseId\`, \`type\` (\`photo\` / \`sensor\`), \`source\`, \`file\`
- **Response (200)**:
\`\`\`json
{
  "success": true,
  "evidence": {
    "id": "ev-174000...",
    "caseId": "C-1048",
    "uri": "/uploads/ev-174000-a1b2c3d4.jpg",
    "mimeType": "image/jpeg",
    "size": 421050,
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
\`\`\`
`);

  // 12-api/field-observations.md
  write('12-api/field-observations.md', `---
id: field-observations
title: Field Observations API
sidebar_position: 7
---

# Field Observations API

<span className="badge-implemented">Implemented</span>

- Integrates with the \`field_observations\` table to capture on-the-ground damage verifications, sensor data, and GPS telemetry.
`);

  // 12-api/analytics.md
  write('12-api/analytics.md', `---
id: analytics
title: Analytics API
sidebar_position: 8
---

# Analytics API Reference

### \`GET /api/analytics/overview\`
Returns aggregated operational metrics and funnel statistics:
\`\`\`json
{
  "casesTotal": 18,
  "needsReview": 4,
  "confirmed": 10,
  "rejected": 2,
  "uncertain": 2,
  "falsePositiveRate": 14,
  "averageTimeToAssess": 24,
  "averageTimeToVerify": 45,
  "averageTimeToTask": 18,
  "slaCompliance": 92,
  "funnel": { "detected": 18, "verified": 10, "actioned": 8, "closed": 6 }
}
\`\`\`
`);

  // 12-api/audit.md
  write('12-api/audit.md', `---
id: audit
title: Audit API
sidebar_position: 9
---

# Audit API Reference

### \`GET /api/cases/:id/audit\`
Fetch immutable chronological log of actions for a given case.
`);

  // 12-api/demo.md
  write('12-api/demo.md', `---
id: demo
title: Demo Replay API
sidebar_position: 10
---

# Demo Replay API Reference

<span className="badge-dev">Development Replay</span>

### \`POST /api/demo/load\`
Idempotently clears and re-seeds the deterministic Chennai Urban Flood scenario (\`inc-chennai-demo\`), seeded user accounts, and hero case \`C-1048\`.
- **Permissions**: System Admin, Organization Admin

### \`POST /api/demo/reset\`
Alias to \`/api/demo/load\` returning a 307 redirect.
`);

  // 12-api/errors.md
  write('12-api/errors.md', `---
id: errors
title: API Error Codes
sidebar_position: 11
---

# API Error Codes & Handling

| HTTP Status | Error Code | Example Payload |
| :--- | :--- | :--- |
| **400** | \`BAD_REQUEST\` | \`{ "error": { "code": "BAD_REQUEST", "message": "Email and password required" } }\` |
| **401** | \`UNAUTHORIZED\` | \`{ "error": { "code": "UNAUTHORIZED", "message": "Not authenticated" } }\` |
| **403** | \`FORBIDDEN\` | \`{ "error": { "code": "FORBIDDEN", "message": "Insufficient permissions" } }\` |
| **404** | \`NOT_FOUND\` | \`{ "error": { "code": "NOT_FOUND", "message": "Case not found" } }\` |
| **409** | \`VERSION_CONFLICT\`| \`{ "error": { "code": "VERSION_CONFLICT", "serverVersion": 2 } }\` |
| **409** | \`INVALID_TRANSITION\` | \`{ "error": { "code": "INVALID_TRANSITION", "message": "Cannot transition from CLOSED to TASKED" } }\` |
`);

  // 13-testing/testing-strategy.md
  write('13-testing/testing-strategy.md', `---
id: testing-strategy
title: Testing Strategy
sidebar_position: 1
---

# Testing Strategy Overview

<span className="badge-implemented">Implemented</span>

The testing framework employs **Vitest** for unit tests and TypeScript-driven end-to-end API suites.

\`\`\`mermaid
flowchart TD
    A[Unit Tests: Vitest] --> D[CI / Validation Pipeline]
    B[Integration Tests: OCC & State Machines] --> D
    C[E2E Scenario Suite: test-e2e.js] --> D
\`\`\`
`);

  // 13-testing/unit-tests.md
  write('13-testing/unit-tests.md', `---
id: unit-tests
title: Unit Testing
sidebar_position: 2
---

# Unit Testing with Vitest

<span className="badge-implemented">Implemented</span>

Unit tests validate mathematical models and deterministic formulas:

\`\`\`typescript
// artifacts/api-server/src/lib/priority.test.ts
import { expect, test } from "vitest";
import { calculatePriority } from "./priority";

test("calculatePriority yields canonical output 83", () => {
  const result = calculatePriority("Severe", "Hospital", "High", 28.8, true, 0.55);
  expect(result.score).toBe(83);
});
\`\`\`

Run unit tests:
\`\`\`bash
pnpm run test
\`\`\`
`);

  // 13-testing/integration-tests.md
  write('13-testing/integration-tests.md', `---
id: integration-tests
title: Integration Tests
sidebar_position: 3
---

# Integration Tests

<span className="badge-implemented">Implemented</span>

Integration suites test state machine boundaries against a live PostgreSQL test database, verifying atomic transitions, OCC version increments, and audit record insertions.
`);

  // 13-testing/end-to-end-tests.md
  write('13-testing/end-to-end-tests.md', `---
id: end-to-end-tests
title: End-to-End Tests
sidebar_position: 4
---

# End-to-End Scenario Testing

<span className="badge-implemented">Implemented</span>

The automated test script \`test-e2e.js\` validates the entire operational lifecycle:
1. **RBAC Guard Test**: Verifies an Analyst cannot \`POST /api/incidents\` (HTTP 403).
2. **OCC Conflict Test**: Simulates concurrent triage by Clients A and B to verify HTTP 409 rejection on stale version.
3. **Audit Verification**: Asserts audit event records exist for all case mutations.

Execute the suite:
\`\`\`bash
node test-e2e.js
\`\`\`
`);

  // 13-testing/api-tests.md
  write('13-testing/api-tests.md', `---
id: api-tests
title: API Tests
sidebar_position: 5
---

# Automated API Test Suites

<span className="badge-implemented">Implemented</span>

API tests validate response contracts against OpenAPI specifications, checking required JSON fields, status codes, and error envelopes.
`);

  // 13-testing/security-tests.md
  write('13-testing/security-tests.md', `---
id: security-tests
title: Security Tests
sidebar_position: 6
---

# Security & Pen-Testing Suites

<span className="badge-implemented">Implemented</span>

Security test suites verify:
- Unauthenticated requests to protected endpoints return \`401\`.
- Role escalation attempts return \`403\`.
- File uploads with fake extensions and invalid magic bytes return \`400\`.
- Path traversal sequences (e.g. \`../../etc/passwd\`) in upload filenames are sanitized.
`);

  // 13-testing/offline-tests.md
  write('13-testing/offline-tests.md', `---
id: offline-tests
title: Offline Tests
sidebar_position: 7
---

# Offline & Sync Test Suites

<span className="badge-implemented">Implemented</span>

Tests simulate offline network states (\`navigator.onLine = false\`), enqueueing observations into IndexedDB, and verifying zero-data-loss replay upon reconnection.
`);

  // 13-testing/test-data.md
  write('13-testing/test-data.md', `---
id: test-data
title: Test Data
sidebar_position: 8
---

# Test Data & Replay Fixtures

<span className="badge-dev">Development Replay</span>

Deterministic fixtures are defined in \`artifacts/api-server/src/routes/demo-data.ts\`, containing the Chennai Urban Flood dataset with 7 realistic infrastructure cases.
`);

  // 14-security/security-overview.md
  write('14-security/security-overview.md', `---
id: security-overview
title: Security Overview
sidebar_position: 1
---

# Security Overview

<span className="badge-implemented">Implemented</span>

DRAXELYRA adheres to strict security engineering practices to protect sensitive critical infrastructure locations, tactical responder identities, and operational plans.
`);

  // 14-security/authentication-security.md
  write('14-security/authentication-security.md', `---
id: authentication-security
title: Authentication Security
sidebar_position: 2
---

# Authentication Security

<span className="badge-implemented">Implemented</span>

- **Password Hashing**: Bcrypt with 10 salt rounds.
- **Session Tokens**: Cryptographically random session identifiers signed via HMAC-SHA256.
- **Cookie Flags**: \`HttpOnly\`, \`SameSite=Lax\`, and \`Secure\` in production.
`);

  // 14-security/authorization-security.md
  write('14-security/authorization-security.md', `---
id: authorization-security
title: Authorization Security
sidebar_position: 3
---

# Authorization & Role Boundaries

<span className="badge-implemented">Implemented</span>

- Explicit role checks on all state-mutating endpoints.
- Separation of duties: Analysts review signals; only Dispatchers/Commanders can create binding field tasks.
`);

  // 14-security/file-upload-security.md
  write('14-security/file-upload-security.md', `---
id: file-upload-security
title: Upload Security
sidebar_position: 4
---

# File Upload Security & Magic-Byte Validation

<span className="badge-implemented">Implemented</span>

The upload handler validates real binary header signatures:

\`\`\`typescript
function checkMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (mimetype === 'image/jpeg') return hex.startsWith('FFD8FF');
  if (mimetype === 'image/png') return hex === '89504E47';
  if (mimetype === 'image/webp') {
    return hex === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57454250';
  }
  if (mimetype === 'video/mp4') return buffer.toString('hex', 4, 8).toUpperCase() === '66747970';
  return false;
}
\`\`\`
`);

  // 14-security/input-validation.md
  write('14-security/input-validation.md', `---
id: input-validation
title: Input Validation
sidebar_position: 5
---

# Input Validation & Sanitization

<span className="badge-implemented">Implemented</span>

- Filenames are sanitized using regex: \`.replace(/[^a-z0-9.]/g, '')\`.
- All JSON payloads are validated with Zod schemas.
`);

  // 14-security/data-protection.md
  write('14-security/data-protection.md', `---
id: data-protection
title: Data Protection
sidebar_position: 6
---

# Data Protection & Privacy

<span className="badge-implemented">Implemented</span>

- Passwords are never logged by the Pino HTTP serializer.
- Database access uses parameterized queries via Drizzle ORM, eliminating SQL injection.
`);

  // 14-security/ai-security.md
  write('14-security/ai-security.md', `---
id: ai-security
title: AI Security
sidebar_position: 7
---

# AI Security & Adversarial Robustness

<span className="badge-implemented">Implemented</span>

- Mandatory human-in-the-loop validation prevents adversarial satellite perturbations or sensor artifacts from directly triggering emergency field deployments.
`);

  // 14-security/auditability.md
  write('14-security/auditability.md', `---
id: auditability
title: Tamper-Evident Auditability
sidebar_position: 8
---

# Tamper-Evident Auditability

<span className="badge-implemented">Implemented</span>

- Cryptographic SHA-256 hashes generated for all evidence uploads.
- Append-only audit log in PostgreSQL.
`);

  // 14-security/threat-model.md
  write('14-security/threat-model.md', `---
id: threat-model
title: Threat Model
sidebar_position: 9
---

# Threat Model & Mitigation Matrix

| Threat / Attack Vector | Risk | Mitigation in DRAXELYRA |
| :--- | :--- | :--- |
| **Concurrent Triage Overwrite** | Critical | Optimistic Concurrency Control (OCC) with atomic version CAS. |
| **Malicious File Upload** | High | Magic-byte signature verification, size limits (50MB), filename sanitization. |
| **Unauthorized Action Dispatch** | High | Route-level RBAC middleware (\`requireRole\`). |
| **Credential Compromise** | Medium | Bcrypt hashing + secure session expiration. |
| **SQL Injection** | Critical | Parameterized queries enforced by Drizzle ORM. |
`);

  console.log('API, Testing, and Security documentation generated.');
}
