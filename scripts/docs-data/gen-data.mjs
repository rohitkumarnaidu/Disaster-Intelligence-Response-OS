import fs from 'fs';
import path from 'path';

export function generateData(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 06-database/overview.md
  write('06-database/overview.md', `# Database Overview

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** managed through **Drizzle ORM** (\`lib/db\`). The database stores operational entities, geospatial geometries (in GeoJSON format), binary evidence metadata, user sessions, and immutable audit logs.

---

## Technical Stack & Connection Pooling

- **Database Engine**: PostgreSQL 15+
- **ORM**: Drizzle ORM (\`drizzle-orm\`, \`drizzle-kit\`)
- **Connection Pooling**: \`pg.Pool\` in \`lib/db/src/index.ts\`
- **Session Table**: Managed via \`connect-pg-simple\` with automatic cookie expiration cleanup
- **Schema Location**: \`lib/db/src/schema/index.ts\`
`);

  // 06-database/schema.md
  write('06-database/schema.md', `# Database Schema Reference

<span className="badge-implemented">Implemented</span>

The complete schema is defined in \`lib/db/src/schema/index.ts\`.

---

## Core Tables

### 1. \`users\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Unique user ID |
| \`name\` | \`text\` | NOT NULL | User's full name |
| \`email\` | \`text\` | NOT NULL, UNIQUE | User email address |
| \`password_hash\` | \`text\` | NOT NULL | Bcrypt hashed password |
| \`role\` | \`text\` | NOT NULL | System / operational role |
| \`organization_id\` | \`text\` | NULLABLE | Associated organization ID |
| \`created_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Record creation time |

### 2. \`incidents\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Unique incident identifier |
| \`name\` | \`text\` | NOT NULL | Operation title |
| \`disaster_type\` | \`text\` | NOT NULL | Hazard category (e.g., Urban flood) |
| \`status\` | \`text\` | NOT NULL | Operational status (Active, Closed) |
| \`start_time\` | \`timestamp\` | NULLABLE | Incident start timestamp |
| \`end_time\` | \`timestamp\` | NULLABLE | Incident closure timestamp |
| \`aoi\` | \`jsonb\` | NULLABLE | GeoJSON Area of Interest boundary |
| \`source\` | \`text\` | NULLABLE | Ingestion source identifier |
| \`description\` | \`text\` | NULLABLE | Incident summary |
| \`severity\` | \`text\` | NULLABLE | Operational severity rating |
| \`created_by\` | \`text\` | REFERENCES \`users(id)\` | Creator user ID |
| \`created_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Timestamp |
| \`updated_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Timestamp |

### 3. \`critical_assets\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Asset identifier |
| \`name\` | \`text\` | NOT NULL | Facility name (e.g. General Hospital) |
| \`type\` | \`text\` | NOT NULL | Infrastructure type (Hospital, Bridge, Utility) |
| \`location\` | \`jsonb\` | NOT NULL | Lat/Lng coordinates \`{lat, lng}\` |
| \`criticality_score\`| \`integer\` | NOT NULL | Inherent asset importance (0–100) |
| \`population_exposure_tier\` | \`text\` | NOT NULL | Vulnerability tier (High, Medium, Low) |

### 4. \`detections\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Detection identifier |
| \`incident_id\` | \`text\` | REFERENCES \`incidents(id)\` | Incident context |
| \`imagery_id\` | \`text\` | REFERENCES \`imagery_assets(id)\`| Source imagery pass |
| \`geometry\` | \`jsonb\` | NOT NULL | GeoJSON geometry / point |
| \`class\` | \`text\` | NOT NULL | Damage class (Structure damage, etc.) |
| \`severity\` | \`text\` | NOT NULL | Observed severity tier |
| \`confidence\` | \`doublePrecision\` | NOT NULL | Model statistical confidence (0.0–1.0) |
| \`model_name\` | \`text\` | NOT NULL | AI model identifier |
| \`model_version\` | \`text\` | NOT NULL | Model release version (e.g., v2.4.1) |
| \`inference_timestamp\` | \`timestamp\` | NOT NULL | Inference execution timestamp |

### 5. \`cases\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Case identifier (e.g. C-1048) |
| \`incident_id\` | \`text\` | REFERENCES \`incidents(id)\` | Incident context |
| \`detection_id\` | \`text\` | REFERENCES \`detections(id)\` | Linked AI detection |
| \`asset_id\` | \`text\` | REFERENCES \`critical_assets(id)\` | Linked critical facility |
| \`status\` | \`text\` | NOT NULL | Lifecycle state (\`NEEDS_REVIEW\`, etc.) |
| \`priority_score\`| \`doublePrecision\` | NULLABLE | Computed priority score (0–100) |
| \`priority_breakdown\` | \`jsonb\` | NULLABLE | Multi-factor component values |
| \`review_state\` | \`text\` | NOT NULL | Human review state (\`PENDING\`, etc.) |
| \`owner\` | \`text\` | REFERENCES \`users(id)\` | Assigned case owner |
| \`version\` | \`integer\` | NOT NULL, DEFAULT 1 | Optimistic concurrency version |
| \`created_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Creation timestamp |
| \`updated_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Last mutation timestamp |

### 6. \`tasks\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Task identifier |
| \`case_id\` | \`text\` | REFERENCES \`cases(id)\` | Linked operational case |
| \`title\` | \`text\` | NOT NULL | Action order title |
| \`description\` | \`text\` | NULLABLE | Detailed tactical instructions |
| \`priority\` | \`integer\` | NOT NULL | Task priority score (inherited) |
| \`assigned_team\`| \`text\` | NULLABLE | Target response group |
| \`assigned_user\`| \`text\` | REFERENCES \`users(id)\` | Specific assignee |
| \`status\` | \`text\` | NOT NULL | Task status (\`UNASSIGNED\`, etc.) |
| \`version\` | \`integer\` | NOT NULL, DEFAULT 1 | OCC version |
| \`created_at\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Dispatch timestamp |
| \`due_at\` | \`timestamp\` | NULLABLE | SLA expiration timestamp |
| \`escalation_at\`| \`timestamp\` | NULLABLE | Escalation trigger timestamp |
| \`completed_at\` | \`timestamp\` | NULLABLE | Completion timestamp |

### 7. \`evidence\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Evidence artifact ID |
| \`case_id\` | \`text\` | REFERENCES \`cases(id)\` | Linked case |
| \`type\` | \`text\` | NOT NULL | Media type (Image, Video, Sensor) |
| \`uri\` | \`text\` | NOT NULL | Static download URI |
| \`source\` | \`text\` | NOT NULL | Upload origin (Field Upload, Drone) |
| \`mime_type\` | \`text\` | NULLABLE | Validated MIME type |
| \`size\` | \`integer\` | NULLABLE | Byte size |
| \`checksum\` | \`text\` | NULLABLE | SHA-256 binary hash |
| \`metadata\` | \`jsonb\` | NULLABLE | EXIF & location metadata |
| \`created_by\` | \`text\` | REFERENCES \`users(id)\` | Uploader ID |
| \`timestamp\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Upload timestamp |

### 8. \`audit_events\`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | PRIMARY KEY | Unique audit log ID |
| \`actor_id\` | \`text\` | REFERENCES \`users(id)\` | Acting user ID |
| \`entity_type\` | \`text\` | NOT NULL | Entity domain (\`CASE\`, \`TASK\`, \`INCIDENT\`) |
| \`entity_id\` | \`text\` | NOT NULL | Target entity ID |
| \`action\` | \`text\` | NOT NULL | Action string (e.g. \`TRANSITIONED_TO_CONFIRMED\`) |
| \`metadata\` | \`jsonb\` | NULLABLE | Payload / state diff |
| \`timestamp\` | \`timestamp\` | NOT NULL, DEFAULT NOW() | Event timestamp |
`);

  // 06-database/relationships.md
  write('06-database/relationships.md', `# Relationships & Foreign Keys

<span className="badge-implemented">Implemented</span>

Drizzle relations link parent and child entities for declarative joins:

\`\`\`typescript
export const casesRelations = relations(cases, ({ one, many }) => ({
  incident: one(incidents, { fields: [cases.incidentId], references: [incidents.id] }),
  detection: one(detections, { fields: [cases.detectionId], references: [detections.id] }),
  asset: one(criticalAssets, { fields: [cases.assetId], references: [criticalAssets.id] }),
  tasks: many(tasks),
  evidence: many(evidence),
  history: many(caseStatusHistory),
}));
\`\`\`
`);

  // 06-database/migrations.md
  write('06-database/migrations.md', `# Migrations & Schema Synchronization

<span className="badge-implemented">Implemented</span>

- **Development Schema Push**: \`pnpm --filter @workspace/db run push\`
- **Migration Generation**: \`drizzle-kit generate\`
- **Migration Execution**: \`lib/db/migrate.ts\`
`);

  // 06-database/indexing.md
  write('06-database/indexing.md', `# Indexing & Query Optimization

<span className="badge-implemented">Implemented</span>

1. \`cases(incident_id, priority_score DESC)\`
2. \`tasks(case_id, status)\`
3. \`audit_events(entity_id, timestamp DESC)\`
4. \`session(sid, expire)\`
`);

  // 06-database/transactions.md
  write('06-database/transactions.md', `# Transactional Integrity

<span className="badge-implemented">Implemented</span>

Multi-step operational mutations are wrapped in database transactions via \`db.transaction(async (tx) => { ... })\`.
`);

  // 06-database/concurrency.md
  write('06-database/concurrency.md', `# Optimistic Concurrency Control (OCC)

<span className="badge-implemented">Implemented</span>

Compare-And-Swap SQL updates prevent race conditions:

\`\`\`sql
UPDATE cases
SET status = $1, version = version + 1, updated_at = NOW()
WHERE id = $2 AND version = $3
RETURNING *;
\`\`\`
`);

  // 07-authentication/authentication.md
  write('07-authentication/authentication.md', `# Authentication Architecture

<span className="badge-implemented">Implemented</span>

Session-based authentication backed by PostgreSQL and Bcrypt hashing.
`);

  // 07-authentication/sessions.md
  write('07-authentication/sessions.md', `# Session Management

<span className="badge-implemented">Implemented</span>

Sessions stored in PostgreSQL \`session\` table using \`connect-pg-simple\`.
`);

  // 07-authentication/authorization.md
  write('07-authentication/authorization.md', `# Authorization & RBAC

<span className="badge-implemented">Implemented</span>

Route guards enforced via \`requireAuth\` and \`requireRole(...roles)\`.
`);

  // 07-authentication/roles.md
  write('07-authentication/roles.md', `# User Roles

<span className="badge-implemented">Implemented</span>

Roles: \`System Admin\`, \`Organization Admin\`, \`Commander\`, \`Disaster Officer\`, \`Analyst\`, \`Manager\`, \`Field Responder\`.
`);

  // 07-authentication/permissions.md
  write('07-authentication/permissions.md', `# Permissions Matrix

<span className="badge-implemented">Implemented</span>

Maps API routes to authorized role sets.
`);

  // 07-authentication/security-model.md
  write('07-authentication/security-model.md', `# Security Model Overview

<span className="badge-implemented">Implemented</span>

Defense-in-depth architecture covering transport, session, input validation, and auditability.
`);

  // 08-domain/incident-management.md
  write('08-domain/incident-management.md', `# Incident Management

<span className="badge-implemented">Implemented</span>

Manages disaster operations, AOI boundaries, hazard classification, and operational lifecycles.
`);

  // 08-domain/case-management.md
  write('08-domain/case-management.md', `# Case Management

<span className="badge-implemented">Implemented</span>

Manages candidate triage cases joining AI detections with critical facilities.
`);

  // 08-domain/case-lifecycle.md
  write('08-domain/case-lifecycle.md', `# Case Lifecycle & Finite State Machine

<span className="badge-implemented">Implemented</span>

Governed by the state machine in \`artifacts/api-server/src/services/case-state-machine.ts\`.

\`\`\`mermaid
stateDiagram-v2
    [*] --> DETECTED
    DETECTED --> NEEDS_REVIEW
    NEEDS_REVIEW --> CONFIRMED: Analyst Review (Confirmed)
    NEEDS_REVIEW --> REJECTED: Analyst Review (Rejected)
    NEEDS_REVIEW --> UNCERTAIN: Analyst Review (Uncertain)
    
    CONFIRMED --> PRIORITIZED: Score Calculated
    CONFIRMED --> TASKED: Task Assigned
    PRIORITIZED --> TASKED: Task Assigned
    
    TASKED --> IN_PROGRESS: Field Unit En Route
    IN_PROGRESS --> FIELD_VERIFIED: Ground Truth Confirmed
    IN_PROGRESS --> ACTIONED: Remediation Completed
    FIELD_VERIFIED --> ACTIONED: Action Completed
    
    ACTIONED --> CLOSED: Final Closure
    REJECTED --> CLOSED: Archived False Positive
    UNCERTAIN --> CLOSED: Dismissed
    CLOSED --> [*]
\`\`\`
`);

  // 08-domain/task-management.md
  write('08-domain/task-management.md', `# Task Management & SLAs

<span className="badge-implemented">Implemented</span>

Tasks represent accountable operational response orders.

\`\`\`mermaid
stateDiagram-v2
    [*] --> UNASSIGNED
    UNASSIGNED --> ASSIGNED: Dispatcher Assigns Team
    ASSIGNED --> IN_PROGRESS: Responder Acknowledges
    ASSIGNED --> UNASSIGNED: Reallocated
    IN_PROGRESS --> BLOCKED: Access Blocked / Hazmat
    IN_PROGRESS --> COMPLETED: Action Completed
    IN_PROGRESS --> VERIFIED: Field Verification Uploaded
    BLOCKED --> IN_PROGRESS: Route Cleared
    COMPLETED --> VERIFIED: Ground Truth Checked
    COMPLETED --> CLOSED: Commander Signoff
    VERIFIED --> CLOSED: Final Close
    CLOSED --> [*]
\`\`\`
`);

  // 08-domain/priority-engine.md
  write('08-domain/priority-engine.md', `# Explainable Priority Engine

<span className="badge-implemented">Implemented</span>

The Priority Engine (\`artifacts/api-server/src/lib/priority.ts\`) evaluates operational urgency through a deterministic mathematical model.

---

## Mathematical Formula

\`\`\`
Priority = round(0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * ConfidenceInput)
\`\`\`

Where:
- **S** (0 to 100): Structural Severity Score
- **C** (0 to 100): Facility Criticality Score
- **E** (0 to 100): Population Exposure Score
- **U** (0 to 100): Urgency & Access Score
- **ConfidenceInput** (0 to 100): Model Confidence (\`confidence * 100\`)

---

## Scoring Factor Tables

### 1. Structural Severity (S)
| Severity Tier | Value | Rationale |
| :--- | :--- | :--- |
| \`Destroyed\` | **100** | Catastrophic collapse / complete loss of function |
| \`Severe\` | **75** | Major structural failure / unpassable roadway |
| \`Moderate\` | **45** | Partial roof / wall damage, standing water |
| \`Uncertain\` | **35** | Obscured by cloud / smoke, requires investigation |
| \`Minor\` | **20** | Superficial cosmetic impact |
| \`No damage\` | **0** | Baseline intact |

### 2. Facility Criticality (C)
| Asset Type | Value |
| :--- | :--- |
| \`Hospital\` / \`Emergency\` | **100** |
| \`Bridge\` / Major Arterial | **85** |
| \`Government\` / \`Utility\` (Substation/Water) | **75** |
| \`School\` / Shelter Facility | **70** |
| \`Residential\` Zone | **40** |
| \`Commercial\` Property | **30** |

### 3. Population Exposure (E)
| Exposure Tier | Value |
| :--- | :--- |
| \`High\` | **90** |
| \`Medium\` | **55** |
| \`Low\` | **20** |

### 4. Urgency Score (U)
\`\`\`
U = min(100, max(0, 100 - (hours / 72) * 100) + (accessConstrained ? 20 : 0))
\`\`\`

---

## Canonical Test Case (Hero Case C-1048)

\`\`\`typescript
const result = calculatePriority(
  "Severe",      // Severity = 75  => 0.30 * 75 = 22.5 pts
  "Hospital",    // Criticality = 100 => 0.25 * 100 = 25.0 pts
  "High",        // Exposure = 90  => 0.20 * 90 = 18.0 pts
  28.8,          // Urgency hours (28.8h elapsed) + accessConstrained => 12.0 pts
  true,          // Access constrained (+20)
  0.55           // Confidence = 55% => 0.10 * 55 = 5.5 pts
);

// Total = 22.5 + 25.0 + 18.0 + 12.0 + 5.5 = 83.0 (Score: 83)
\`\`\`
`);

  // 08-domain/evidence-management.md
  write('08-domain/evidence-management.md', `# Evidence Management & Integrity Pipeline

<span className="badge-implemented">Implemented</span>

File validation, magic-byte inspection, SHA-256 hashing, and path traversal protection.
`);

  // 08-domain/outcomes.md
  write('08-domain/outcomes.md', `# Response Outcomes & After-Action Recording

<span className="badge-implemented">Implemented</span>

Captures verified ground truth, actions completed, and archival evidence.
`);

  // 08-domain/audit-trail.md
  write('08-domain/audit-trail.md', `# Immutable Audit Trail

<span className="badge-implemented">Implemented</span>

Append-only event log recording all transitions, actors, and metadata.
`);
}
