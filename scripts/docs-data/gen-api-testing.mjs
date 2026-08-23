import fs from 'fs';
import path from 'path';

export function generateApiTesting(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 12-api/overview.md
  write('12-api/overview.md', `# REST API Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA REST API is built with **Express 5** and governed by the **OpenAPI 3.1** specification located at \`lib/api-spec/openapi.yaml\`.

---

## Base URL & Transport

- **Base Endpoint**: \`http://localhost:5000/api\` (or configured \`PORT\`)
- **Protocol**: HTTP/1.1 and HTTP/2 over TLS in production
- **Content Type**: \`application/json\` (except \`/api/evidence/upload\` which uses \`multipart/form-data\`)
- **Authentication**: HTTP-only secure cookie session (\`connect.sid\`)

---

## Global HTTP Response Envelope

Standard successful responses return the raw entity or array payload with appropriate HTTP status codes (\`200 OK\`, \`201 Created\`).

Error responses return a structured error envelope:

\`\`\`json
{
  "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VERSION_CONFLICT | SERVER_ERROR",
  "message": "Human readable description of the error",
  "details": {}
}
\`\`\`
`);

  // 12-api/authentication.md
  write('12-api/authentication.md', `# Authentication API

<span className="badge-implemented">Implemented</span>

### 1. \`POST /api/auth/login\`
- **Description**: Authenticates user credentials and issues a signed session cookie.
- **Access**: Public
- **Request Body**:
  \`\`\`json
  {
    "email": "analyst@draxelyra.local",
    "password": "demo123"
  }
  \`\`\`
- **Success Response (\`200 OK\`)**:
  \`\`\`json
  {
    "id": "usr-analyst-01",
    "name": "Maya Chen",
    "email": "analyst@draxelyra.local",
    "role": "analyst",
    "organizationId": "org-tn-sdma"
  }
  \`\`\`

### 2. \`GET /api/auth/me\`
- **Description**: Retrieves current authenticated user profile.
- **Access**: Requires active session.
- **Success Response (\`200 OK\`)**: User profile object.

### 3. \`POST /api/auth/logout\`
- **Description**: Destroys current session in PostgreSQL store and clears client cookie.
- **Access**: Requires active session.
- **Success Response (\`200 OK\`)**: \`{ "success": true }\`
`);

  // 12-api/incidents.md
  write('12-api/incidents.md', `# Incidents API

<span className="badge-implemented">Implemented</span>

### 1. \`GET /api/incidents\`
- **Description**: Lists all recorded disaster incidents.
- **Access**: Authenticated users.
- **Response (\`200 OK\`)**: Array of incident objects.

### 2. \`POST /api/incidents\`
- **Description**: Registers a new operational incident and AOI boundary.
- **Access**: \`system_admin\`, \`commander\`, \`org_admin\`.
- **Request Body**:
  \`\`\`json
  {
    "name": "Chennai Urban Flood Response",
    "disasterType": "Urban flood",
    "severity": "critical",
    "aoi": {
      "type": "Polygon",
      "coordinates": [[[80.15, 13.0], [80.30, 13.0], [80.30, 13.15], [80.15, 13.15], [80.15, 13.0]]]
    }
  }
  \`\`\`

### 3. \`GET /api/incidents/:id/map\`
- **Description**: Returns aggregated GeoJSON FeatureCollections for the incident AOI, critical assets, detections, prioritized cases, and field observations.
- **Access**: Authenticated users.
`);

  // 12-api/cases.md
  write('12-api/cases.md', `# Cases API

<span className="badge-implemented">Implemented</span>

### 1. \`GET /api/cases\`
- **Description**: Retrieves prioritized operational triage queue.
- **Query Parameters**: \`incidentId\`, \`status\`, \`minPriority\`.
- **Response (\`200 OK\`)**: List of cases joined with critical assets and detections.

### 2. \`POST /api/cases/:id/review\`
- **Description**: Submits human triage decision with Optimistic Concurrency Control (OCC).
- **Access**: \`analyst\`, \`commander\`, \`system_admin\`.
- **Request Body**:
  \`\`\`json
  {
    "decision": "confirmed",
    "notes": "Satellite imagery confirms significant structural inundation.",
    "version": 1
  }
  \`\`\`
- **Concurrency Handling**: If \`version\` does not match current database version, returns \`409 Conflict\` with \`VERSION_CONFLICT\`.
- **Audit Logging**: Appends an event to \`audit_events\` recording decision, actor, and timestamp.

### 3. \`GET /api/cases/:id/audit\`
- **Description**: Returns complete chronological audit history for the case.
`);

  // 12-api/tasks.md
  write('12-api/tasks.md', `# Tasks API

<span className="badge-implemented">Implemented</span>

### 1. \`GET /api/tasks\`
- **Description**: Lists response tasks with SLA status.
- **Access**: Authenticated users.

### 2. \`POST /api/tasks\`
- **Description**: Dispatches a new field response task linked to a confirmed case.
- **Access**: \`manager\`, \`commander\`, \`system_admin\`.
- **Request Body**:
  \`\`\`json
  {
    "caseId": "C-1048",
    "title": "Hospital Power & Access Inspection",
    "priority": 83,
    "assignedTeam": "Public Works & Hazmat",
    "dueAt": "2026-08-25T12:00:00Z"
  }
  \`\`\`

### 3. \`PATCH /api/tasks/:id\`
- **Description**: Updates task status (\`IN_PROGRESS\`, \`BLOCKED\`, \`COMPLETED\`, \`VERIFIED\`) with OCC version check.
`);

  // 12-api/evidence.md
  write('12-api/evidence.md', `# Evidence API

<span className="badge-implemented">Implemented</span>

### \`POST /api/evidence/upload\`
- **Description**: Ingests ground-truth photos and tactical attachments.
- **Content-Type**: \`multipart/form-data\`
- **Validation Pipeline**:
  1. Size limit: Maximum 50 MB.
  2. MIME type whitelist: \`image/jpeg\`, \`image/png\`, \`image/webp\`, \`video/mp4\`.
  3. Binary magic-byte header inspection.
  4. Computes SHA-256 checksum.
  5. Stores file to \`uploads/\` with randomized GUID filename.
`);

  // 12-api/field-observations.md
  write('12-api/field-observations.md', `# Field Observations API

<span className="badge-implemented">Implemented</span>

### \`POST /api/tasks/:id/field-observation\`
- **Description**: Tactical personnel ground truth submission.
- **Request Body**:
  \`\`\`json
  {
    "taskId": "TSK-201",
    "observation": "Water receded by 1 foot; emergency backup generator functional.",
    "location": { "lat": 13.0827, "lng": 80.2707 },
    "evidenceIds": ["evi-8910"]
  }
  \`\`\`
`);

  // 12-api/analytics.md
  write('12-api/analytics.md', `# Analytics API

<span className="badge-implemented">Implemented</span>

### 1. \`GET /api/analytics/summary\`
- **Description**: Real-time KPI summary: active cases, confirmation rate, open tasks, overdue SLA tasks.

### 2. \`GET /api/analytics/funnel\`
- **Description**: Incident lifecycle throughput: \`Detected -> Reviewed -> Tasked -> Field Verified -> Closed\`.
`);

  // 12-api/audit.md
  write('12-api/audit.md', `# Audit Events API

<span className="badge-implemented">Implemented</span>

### \`GET /api/cases/:id/audit\`
- **Description**: Returns immutable chronological log of actions, actors, and metadata diffs.
`);

  // 12-api/demo.md
  write('12-api/demo.md', `# Demo & Scenario Replay API

<span className="badge-dev">Development Replay</span>

### \`POST /api/demo/load\`
- **Description**: Idempotently seeds the Chennai Urban Flood dataset (\`inc-chennai-demo\`), critical facilities, candidate detections, and the hero case (\`C-1048\`).
- **Access**: \`system_admin\`.

### \`POST /api/demo/reset\`
- **Description**: Wipes active demo telemetry and restores initial seed state.
`);

  // 12-api/errors.md
  write('12-api/errors.md', `# Error Codes Reference

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| \`BAD_REQUEST\` | 400 | Payload failed schema validation. |
| \`UNAUTHORIZED\` | 401 | Missing or expired session cookie. |
| \`FORBIDDEN\` | 403 | User role lacks required permission. |
| \`NOT_FOUND\` | 404 | Target entity does not exist. |
| \`VERSION_CONFLICT\` | 409 | Concurrent mutation detected (OCC CAS failed). |
| \`INVALID_TRANSITION\`| 422 | Requested state transition is disallowed by state machine. |
| \`SERVER_ERROR\` | 500 | Unhandled server exception. |
`);

  // 13-testing/testing-strategy.md
  write('13-testing/testing-strategy.md', `# Testing Strategy

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces a multi-tier testing pyramid:

1. **Unit Tests (Vitest)**: Mathematical validation of priority score calculations and individual state machine transitions.
2. **OCC Concurrency Tests**: Race-condition simulations testing concurrent updates to verify \`409 VERSION_CONFLICT\` behavior.
3. **End-to-End API Integration Tests (\`test-e2e.js\`)**: Automated HTTP sequence testing complete triage workflows.
`);

  // 13-testing/unit-tests.md
  write('13-testing/unit-tests.md', `# Unit Testing with Vitest

<span className="badge-implemented">Implemented</span>

Unit tests run via \`pnpm test\`.

### Canonical Priority Formula Test (\`priority.test.ts\`)

\`\`\`typescript
describe('Priority Engine', () => {
  it('calculates canonical Hero Case C-1048 priority as 83', () => {
    const score = calculatePriority('Severe', 'Hospital', 'High', 28.8, true, 0.55);
    expect(score).toBe(83);
  });
});
\`\`\`
`);

  // 13-testing/integration-tests.md
  write('13-testing/integration-tests.md', `# Integration Testing

<span className="badge-implemented">Implemented</span>

Integration tests verify database transactions, PostgreSQL session persistence, and Drizzle ORM queries.
`);

  // 13-testing/end-to-end-tests.md
  write('13-testing/end-to-end-tests.md', `# End-to-End API Verification

<span className="badge-implemented">Implemented</span>

The automated E2E script (\`node test-e2e.js\`) validates:
1. System Admin login & session cookie establishment.
2. Loading deterministic Chennai flood demo replay.
3. Fetching case \`C-1048\` and verifying initial priority score (\`83\`).
4. Submitting analyst confirmation review with version checking.
5. Verifying audit event persistence in \`audit_events\`.
`);

  // 13-testing/api-tests.md
  write('13-testing/api-tests.md', `# API Testing Suite

<span className="badge-implemented">Implemented</span>

All Express API route handlers are validated against the OpenAPI specification schema.
`);

  // 13-testing/security-tests.md
  write('13-testing/security-tests.md', `# Security & Authorization Tests

<span className="badge-implemented">Implemented</span>

Security test suites verify:
- Role boundaries: Field responders cannot access admin demo endpoints.
- Path traversal defenses on file uploads.
- Session cookie \`httpOnly\` and \`secure\` flags.
`);

  // 13-testing/offline-tests.md
  write('13-testing/offline-tests.md', `# Offline Synchronization Tests

<span className="badge-implemented">Implemented</span>

Tests IndexedDB request serialization, event bus dispatching, and queue replay.
`);

  // 13-testing/test-data.md
  write('13-testing/test-data.md', `# Test Data & Seed Fixtures

<span className="badge-implemented">Implemented</span>

The canonical test fixtures in \`artifacts/api-server/src/routes/demo-data.ts\` provide deterministic coordinates, asset geometries, and imagery metadata.
`);

  // 14-security/security-overview.md
  write('14-security/security-overview.md', `# Security Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces a defense-in-depth security model covering authentication, access control, input validation, and media upload integrity.
`);

  // 14-security/authentication-security.md
  write('14-security/authentication-security.md', `# Authentication Security

<span className="badge-implemented">Implemented</span>

- Password hashing: **Bcrypt** with salted rounds.
- Session tokens: Cryptographically random signed cookies stored in PostgreSQL.
`);

  // 14-security/authorization-security.md
  write('14-security/authorization-security.md', `# Authorization & RBAC Security

<span className="badge-implemented">Implemented</span>

Granular middleware guards (\`requireRole\`) ensure least-privilege access across all REST endpoints.
`);

  // 14-security/file-upload-security.md
  write('14-security/file-upload-security.md', `# File Upload Security & Magic Bytes

<span className="badge-implemented">Implemented</span>

- **Magic Byte Signatures**: Leading bytes inspected before saving:
  - JPEG: \`FF D8 FF\`
  - PNG: \`89 50 4E 47\`
  - WebP: \`RIFF....WEBP\`
  - MP4: \`ftyp\`
- **SHA-256 Hashing**: Computed for every upload to maintain chain of custody.
- **Path Traversal Prevention**: Filenames sanitized with GUID identifiers.
`);

  // 14-security/input-validation.md
  write('14-security/input-validation.md', `# Input Validation & Zod

<span className="badge-implemented">Implemented</span>

All request parameters, query strings, and request bodies are validated using generated Zod schemas (\`lib/api-zod\`).
`);

  // 14-security/data-protection.md
  write('14-security/data-protection.md', `# Data Protection & Privacy

<span className="badge-implemented">Implemented</span>

Encryption in transit (TLS) and strict isolation of sensitive operational data.
`);

  // 14-security/ai-security.md
  write('14-security/ai-security.md', `# AI & Model Integrity

<span className="badge-implemented">Implemented</span>

Model inferences are treated as untrusted inputs requiring human verification before triggering operational field tasks.
`);

  // 14-security/auditability.md
  write('14-security/auditability.md', `# Auditability & Compliance

<span className="badge-implemented">Implemented</span>

Every operational action writes an immutable record to PostgreSQL table \`audit_events\`.
`);

  // 14-security/threat-model.md
  write('14-security/threat-model.md', `# Threat Model & Mitigation

| Threat Vector | Potential Impact | Mitigation |
| :--- | :--- | :--- |
| **Session Hijacking** | Unauthorized triage commands | \`httpOnly\`, \`SameSite=Lax\`, \`secure\` cookie flags |
| **Concurrent Edit Collision** | Stale data overwriting live field updates | Optimistic Concurrency Control with atomic CAS |
| **Malicious File Upload** | Remote code execution via upload | Magic-byte header inspection and random GUID naming |
| **Unauthorized Action** | Tactical personnel altering incident parameters | Strict RBAC middleware on all non-read routes |
`);
}
