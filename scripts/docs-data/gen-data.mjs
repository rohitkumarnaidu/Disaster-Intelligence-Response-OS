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

export function generateData(docsDir) {
  console.log('Generating 06-database, 07-authentication, and 08-domain...');

  // ===========================================================================
  // 06-database
  // ===========================================================================

  // 06-database/01-schema.md
  writeFile(docsDir, '06-database/01-schema.md', `---
id: schema
title: Relational Database Schema Specification
sidebar_label: Schema Specification
sidebar_position: 1
---

# Relational Database Schema Specification

<span className="badge-implemented">Implemented</span>

The DRAXELYRA relational database schema is implemented using TypeScript-native **Drizzle ORM** in \`lib/db/src/schema/index.ts\`. It comprises 18 production tables managing system state, geospatial intelligence, triage workflows, and transactional audit trails.

---

## 1. \`users\` & \`session\` Tables

### \`users\`
Stores operator credentials, organizational assignments, and role-based clearance levels.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique user identifier (e.g., \`usr_commander_1\`). |
| \`email\` | \`text\` | \`NOT NULL, UNIQUE\` | Operator email address for login. |
| \`passwordHash\` | \`text\` | \`NOT NULL\` | Salted password hash. |
| \`name\` | \`text\` | \`NOT NULL\` | Full operational display name. |
| \`role\` | \`text\` | \`NOT NULL\` | Role: \`Incident Commander\`, \`Duty Officer\`, \`GIS Analyst\`, etc. |
| \`organization\` | \`text\` | \`NOT NULL\` | Agency/Unit (e.g., \`NDMA Response Team Alpha\`). |
| \`createdAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Account creation timestamp. |
| \`updatedAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Account last modification timestamp. |

### \`session\`
PostgreSQL-backed session table managed via \`connect-pg-simple\`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`sid\` | \`varchar(255)\` | \`PRIMARY KEY\` | Signed session ID from \`connect.sid\` cookie. |
| \`sess\` | \`json\` | \`NOT NULL\` | Serialized session object containing \`userId\`, \`role\`, and \`org\`. |
| \`expire\` | \`timestamp(6)\` | \`NOT NULL, INDEX\` | Session expiration timestamp for automated garbage collection. |

---

## 2. \`incidents\` Table

Represents the root operational crisis aggregate (e.g., Cyclone Remal, Assam Floods 2024).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique incident ID (e.g., \`inc_remal_2024\`). |
| \`name\` | \`text\` | \`NOT NULL\` | Official operational name of the incident. |
| \`disasterType\`| \`text\` | \`NOT NULL\` | Hazard: \`FLOOD\`, \`CYCLONE\`, \`EARTHQUAKE\`, \`WILDFIRE\`, \`LANDSLIDE\`. |
| \`status\` | \`text\` | \`NOT NULL, DEFAULT 'ACTIVE'\` | Status: \`ACTIVE\`, \`MONITORING\`, \`RESOLVED\`, \`ARCHIVED\`. |
| \`severity\` | \`text\` | \`NOT NULL, DEFAULT 'WARNING'\` | Severity level: \`WATCH\`, \`ADVISORY\`, \`WARNING\`, \`CRITICAL\`. |
| \`aoi\` | \`jsonb\` | \`NOT NULL\` | GeoJSON \`Polygon\` or \`MultiPolygon\` defining the Area of Interest. |
| \`startTime\` | \`timestamp\` | \`NOT NULL\` | Time when the crisis event initiated. |
| \`endTime\` | \`timestamp\` | \`NULLABLE\` | Time when the incident was marked resolved. |
| \`source\` | \`text\` | \`NOT NULL\` | Originating agency: \`NDMA SACHET\`, \`IMD\`, \`USGS\`, \`MANUAL\`. |
| \`description\` | \`text\` | \`NULLABLE\` | Operational synopsis and tactical objectives. |
| \`version\` | \`integer\` | \`NOT NULL, DEFAULT 1\` | Monotonic OCC version counter. |
| \`createdAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Creation timestamp. |
| \`updatedAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Last update timestamp. |

---

## 3. \`imagery_assets\` & \`imagery_pairs\`

### \`imagery_assets\`
Metadata registry for ingested satellite swaths, drone orthomosaics, and aerial rasters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique imagery asset identifier. |
| \`incidentId\` | \`text\` | \`FK -> incidents(id)\` | Associated incident theater. |
| \`provider\` | \`text\` | \`NOT NULL\` | Provider: \`COPERNICUS_SENTINEL_1\`, \`COPERNICUS_SENTINEL_2\`, \`PLANET\`. |
| \`sensorType\` | \`text\` | \`NOT NULL\` | Modality: \`OPTICAL\`, \`SAR_C_BAND\`, \`INFRARED\`, \`RGB_DRONE\`. |
| \`acquisitionTime\` | \`timestamp\` | \`NOT NULL\` | Exact UTC sensor capture time. |
| \`spatialResolution\` | \`real\` | \`NOT NULL\` | Ground sample distance (meters per pixel, e.g., \`10.0\`). |
| \`cloudCover\` | \`real\` | \`NULLABLE\` | Percentage cloud obscuration (0.0 to 100.0%). |
| \`bounds\` | \`jsonb\` | \`NOT NULL\` | GeoJSON bounding polygon for the raster swath. |
| \`thumbnailUrl\` | \`text\` | \`NULLABLE\` | Fast web-optimized RGB preview crop URL. |
| \`rawStoragePath\` | \`text\` | \`NOT NULL\` | Filesystem path or object store URI of original COG / SAFE archive. |

### \`imagery_pairs\`
Links pre-disaster baseline imagery with post-disaster acquisition for change detection.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique imagery pair identifier. |
| \`incidentId\` | \`text\` | \`FK -> incidents(id)\` | Associated incident. |
| \`preImageryId\` | \`text\` | \`FK -> imagery_assets(id)\` | Baseline pre-event reference asset. |
| \`postImageryId\` | \`text\` | \`FK -> imagery_assets(id)\` | Target post-event damage asset. |
| \`analysisMethod\`| \`text\` | \`NOT NULL\` | Method: \`SAR_COHERENCE_LOSS\`, \`NDWI_WATER_EXTRACTION\`, \`VLM_DAMAGE\`. |

---

## 4. \`critical_assets\` & \`osm_critical_assets\`

Maintains geographic locations, facility types, and baseline capacities of life-critical infrastructure.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique asset identifier (e.g., \`asset_hosp_silchar\`). |
| \`name\` | \`text\` | \`NOT NULL\` | Facility name (e.g., \`Silchar Medical College & Hospital\`). |
| \`type\` | \`text\` | \`NOT NULL\` | Category: \`HOSPITAL\`, \`BRIDGE\`, \`POWER_SUBSTATION\`, \`WATER_TREATMENT\`. |
| \`location\` | \`jsonb\` | \`NOT NULL\` | GeoJSON \`Point\` coordinate \`[longitude, latitude]\`. |
| \`criticalityScore\` | \`integer\` | \`NOT NULL\` | Base criticality weight (0 to 100, Hospital=100, Bridge=85). |
| \`capacity\` | \`integer\` | \`NULLABLE\` | Bed count, power megawatt rating, or throughput. |
| \`metadata\` | \`jsonb\` | \`DEFAULT '{}'\` | Ingested OSM tags (e.g., \`phone\`, \`operator\`, \`backup_generator\`). |

---

## 5. \`detections\` & \`cases\`

### \`detections\`
Raw machine-generated candidate damage anomalies produced by computer vision models.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique detection ID (e.g., \`det_89201\`). |
| \`incidentId\` | \`text\` | \`FK -> incidents(id)\` | Associated incident. |
| \`imageryAssetId\` | \`text\` | \`FK -> imagery_assets(id)\` | Imagery swath where anomaly was identified. |
| \`hazardType\` | \`text\` | \`NOT NULL\` | Hazard: \`INUNDATION\`, \`STRUCTURAL_COLLAPSE\`, \`ROAD_WASHOUT\`. |
| \`severity\` | \`text\` | \`NOT NULL\` | Model classification: \`DESTROYED\`, \`SEVERE\`, \`MODERATE\`, \`MINOR\`. |
| \`confidenceScore\`| \`real\` | \`NOT NULL\` | Statistical confidence (0.00 to 1.00). |
| \`geometry\` | \`jsonb\` | \`NOT NULL\` | GeoJSON \`Polygon\` or \`Point\` of the damage footprint. |
| \`modelName\` | \`text\` | \`NOT NULL\` | Model: \`gemini-2.5-flash\` or \`draxelyra-cv-baseline-v2\`. |
| \`modelOutput\` | \`jsonb\` | \`NOT NULL\` | Raw parsed JSON response from AI provider. |

### \`cases\`
The core actionable operational aggregate tracking human review, prioritization, and response.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Operational case identifier (e.g., \`C-1048\`). |
| \`incidentId\` | \`text\` | \`FK -> incidents(id)\` | Associated incident theater. |
| \`detectionId\` | \`text\` | \`FK -> detections(id)\` | Originating AI candidate detection. |
| \`criticalAssetId\` | \`text\` | \`FK -> critical_assets(id)\` | Impacted critical infrastructure (if any). |
| \`status\` | \`text\` | \`NOT NULL, DEFAULT 'DETECTED'\` | FSM Status: \`DETECTED\`, \`NEEDS_REVIEW\`, \`CONFIRMED\`, \`TASKED\`, \`CLOSED\`. |
| \`priorityScore\`| \`integer\` | \`NOT NULL\` | Computed explainable priority (0 to 100). |
| \`priorityBreakdown\` | \`jsonb\` | \`NOT NULL\` | JSON object containing 5 factor sub-scores (S, C, E, U, K). |
| \`urgencyHours\` | \`integer\` | \`NOT NULL, DEFAULT 0\` | Elapsed hours since hazard onset for time decay. |
| \`assignedTo\` | \`text\` | \`FK -> users(id)\` | Assigned responder or lead analyst. |
| \`version\` | \`integer\` | \`NOT NULL, DEFAULT 1\` | Monotonic OCC version counter. |
| \`createdAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Creation timestamp. |
| \`updatedAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Last transition timestamp. |

---

## 6. \`tasks\` & \`field_observations\`

### \`tasks\`
Specific operational work orders dispatched to field rescue teams or relief units.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique task identifier (e.g., \`TSK-4091\`). |
| \`caseId\` | \`text\` | \`FK -> cases(id)\` | Originating confirmed case. |
| \`title\` | \`text\` | \`NOT NULL\` | Task title (e.g., \`Deploy High-Capacity De-Watering Pumps\`). |
| \`taskType\` | \`text\` | \`NOT NULL\` | Type: \`EVACUATION\`, \`DEWATERING\`, \`STRUCTURAL_SHORING\`, \`AID_DROP\`. |
| \`status\` | \`text\` | \`NOT NULL, DEFAULT 'UNASSIGNED'\` | FSM: \`UNASSIGNED\`, \`ASSIGNED\`, \`IN_PROGRESS\`, \`COMPLETED\`, \`VERIFIED\`. |
| \`assignedUnit\` | \`text\` | \`NULLABLE\` | Tactical unit (e.g., \`NDRF 1st Battalion Team B\`). |
| \`slaDeadline\` | \`timestamp\` | \`NOT NULL\` | Dynamic SLA deadline calculated from priority score. |
| \`version\` | \`integer\` | \`NOT NULL, DEFAULT 1\` | Monotonic OCC version counter. |
| \`completedAt\` | \`timestamp\` | \`NULLABLE\` | Timestamp when task reached completed state. |

### \`field_observations\`
Ground truth observations, photos, and sensor measurements submitted by field personnel.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique observation ID. |
| \`caseId\` | \`text\` | \`FK -> cases(id)\` | Target case. |
| \`taskId\` | \`text\` | \`FK -> tasks(id)\` | Associated response task. |
| \`userId\` | \`text\` | \`FK -> users(id)\` | Field responder author ID. |
| \`verificationStatus\` | \`text\` | \`NOT NULL\` | Status: \`CONFIRMED_DAMAGED\`, \`NO_DAMAGE_FOUND\`, \`INACCESSIBLE\`. |
| \`groundPhotos\` | \`jsonb\` | \`DEFAULT '[]'\` | Array of uploaded photo evidence URLs. |
| \`waterDepthCm\` | \`integer\` | \`NULLABLE\` | Physical measured flood depth in centimeters. |
| \`location\` | \`jsonb\` | \`NOT NULL\` | GeoJSON \`Point\` captured via field device GPS. |
| \`capturedAt\` | \`timestamp\` | \`NOT NULL\` | Offline capture timestamp on field device. |
| \`syncedAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Timestamp when record was received by server. |

---

## 7. \`outbox_events\` & \`audit_events\`

### \`outbox_events\`
Transactional outbox enabling guaranteed event delivery to WebSockets and SSE.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique event UUID. |
| \`eventType\` | \`text\` | \`NOT NULL\` | Event: \`CASE_CONFIRMED\`, \`TASK_ASSIGNED\`, \`INCIDENT_UPDATED\`. |
| \`entityType\` | \`text\` | \`NOT NULL\` | Entity: \`CASE\`, \`TASK\`, \`INCIDENT\`, \`OBSERVATION\`. |
| \`entityId\` | \`text\` | \`NOT NULL\` | Target entity ID. |
| \`version\` | \`integer\` | \`NOT NULL\` | Entity OCC version at time of event emission. |
| \`payload\` | \`jsonb\` | \`NOT NULL\` | Complete domain event payload. |
| \`status\` | \`text\` | \`NOT NULL, DEFAULT 'PENDING'\` | Status: \`PENDING\`, \`DISPATCHED\`, \`FAILED\`. |
| \`createdAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Database insertion timestamp. |
| \`dispatchedAt\` | \`timestamp\` | \`NULLABLE\` | Outbox dispatcher broadcast timestamp. |

### \`audit_events\`
Immutable audit ledger recording all security and operational mutations across the system.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| \`id\` | \`text\` | \`PRIMARY KEY\` | Unique audit log ID. |
| \`actorId\` | \`text\` | \`NOT NULL\` | User ID or \`SYSTEM_CRON\` executing the mutation. |
| \`action\` | \`text\` | \`NOT NULL\` | Action: \`REVIEW_SUBMITTED\`, \`TASK_TRANSITIONED\`, \`EVIDENCE_UPLOADED\`. |
| \`entityType\` | \`text\` | \`NOT NULL\` | Entity category. |
| \`entityId\` | \`text\` | \`NOT NULL\` | Entity ID. |
| \`metadata\` | \`jsonb\` | \`DEFAULT '{}'\` | Previous vs new state diff, IP address, and client user-agent. |
| \`createdAt\` | \`timestamp\` | \`NOT NULL, DEFAULT NOW()\` | Immutable event timestamp. |
`);

  // 06-database/02-architecture.md
  writeFile(docsDir, '06-database/02-architecture.md', `---
id: architecture
title: Database Connection Management & Strategy
sidebar_label: Database Architecture
sidebar_position: 2
---

# Database Connection Management & Strategy

<span className="badge-implemented">Implemented</span>

DRAXELYRA manages PostgreSQL persistence through a dedicated, type-safe package (\`@workspace/db\`) located in \`lib/db/\`.

---

## Connection Pooling & Drizzle Instance

**Source File**: [\`lib/db/src/index.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/lib/db/src/index.ts)

The database client utilizes \`pg.Pool\` to maintain a pool of reusable TCP connections to PostgreSQL, preventing connection exhaustion during high-concurrency disaster alerts.

\`\`\`typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
\`\`\`

---

## Spatial Geometry Strategy: JSONB vs PostGIS

DRAXELYRA intentionally stores geospatial geometries (AOI boundaries, asset coordinates, detection polygons) as standard GeoJSON in PostgreSQL \`jsonb\` columns rather than requiring the native \`PostGIS\` binary extension:

1. **Zero-Dependency Portability**: Allows running on standard managed PostgreSQL instances (AWS Aurora, Google Cloud SQL, Neon, Supabase, Local Docker) without requiring compiled C binary extensions.
2. **Native JavaScript / TypeScript Interoperability**: GeoJSON objects serialize and deserialize natively without binary WKB (Well-Known Binary) encoding/decoding overhead.
3. **Indexable Topologies**: Critical bounding boxes and coordinates are indexed using PostgreSQL GIN (Generalized Inverted Index) operators:
   \`\`\`sql
   CREATE INDEX idx_cases_location ON cases USING gin (location);
   \`\`\`
`);

  // 06-database/03-concurrency-occ.md
  writeFile(docsDir, '06-database/03-concurrency-occ.md', `---
id: concurrency-occ
title: Optimistic Concurrency Control (OCC) Mechanics
sidebar_label: Concurrency & OCC
sidebar_position: 3
---

# Optimistic Concurrency Control (OCC) Mechanics

<span className="badge-implemented">Implemented</span>

In multi-agency emergency operations centers, multiple duty officers, GIS analysts, and field leads concurrently inspect and update identical crisis cases. DRAXELYRA implements **Optimistic Concurrency Control (OCC)** using a Compare-and-Swap (CAS) atomic database update pattern.

---

## The Monotonic Version Column

Every mutable domain table (\`cases\`, \`tasks\`, \`incidents\`, \`field_observations\`) contains an integer \`version\` column initialized to \`1\`.

Whenever an update occurs, the backend executes an atomic Compare-and-Swap SQL mutation inside a transaction:

\`\`\`sql
UPDATE cases
SET status = $1,
    priority_score = $2,
    version = version + 1,
    updated_at = NOW()
WHERE id = $3 AND version = $4
RETURNING *;
\`\`\`

---

## Compare-and-Swap Transition Algorithm

**Source File**: [\`artifacts/api-server/src/services/case-state-machine.ts:45\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/case-state-machine.ts#L45-L85)

\`\`\`typescript
export async function transitionCase(
  caseId: string,
  targetStatus: CaseStatus,
  userId: string,
  expectedVersion: number,
  notes?: string
) {
  return await db.transaction(async (tx) => {
    // 1. Fetch current database record
    const [current] = await tx.select().from(cases).where(eq(cases.id, caseId));
    if (!current) {
      throw { code: 'NOT_FOUND', message: 'Case ' + caseId + ' not found' };
    }

    // 2. Validate version match (OCC Guard)
    if (current.version !== expectedVersion) {
      throw {
        code: 'VERSION_CONFLICT',
        message: 'Case ' + caseId + ' has been modified by another operator.',
        serverVersion: current.version,
        serverRecord: current,
      };
    }



    // 3. Validate state machine transition graph
    validateTransition(current.status, targetStatus);

    // 4. Execute atomic update with version increment
    const [updated] = await tx
      .update(cases)
      .set({
        status: targetStatus,
        version: expectedVersion + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, caseId), eq(cases.version, expectedVersion)))
      .returning();

    // 5. Insert immutable status history & outbox domain event
    await tx.insert(caseStatusHistory).values({
      caseId,
      fromStatus: current.status,
      toStatus: targetStatus,
      userId,
      reason: notes,
      version: expectedVersion + 1,
    });

    await tx.insert(outboxEvents).values({
      eventType: 'CASE_CONFIRMED',
      entityType: 'CASE',
      entityId: caseId,
      version: expectedVersion + 1,
      payload: updated,
    });

    return updated;
  });
}
\`\`\`

---

## Client Conflict Recovery Flow

When a client receives HTTP 409 \`VERSION_CONFLICT\`:
1. The client intercepts the response payload containing \`serverVersion\` and \`serverRecord\`.
2. The UI displays an amber conflict banner: *"This record was modified by another operator. Latest changes have been loaded."*
3. The local form state is refreshed with the new \`serverVersion\`, allowing the operator to re-verify their notes against the latest data and resubmit without data loss.
`);

  // 06-database/04-er-diagram.md
  writeFile(docsDir, '06-database/04-er-diagram.md', `---
id: er-diagram
title: Complete Entity-Relationship (ER) Diagram
sidebar_label: ER Diagram
sidebar_position: 4
---

# Complete Entity-Relationship (ER) Diagram

<span className="badge-implemented">Implemented</span>

The complete 18-table Entity-Relationship diagram below reflects all primary keys, foreign keys, and cardinality relationships implemented in \`lib/db/src/schema/index.ts\`.

\`\`\`mermaid
erDiagram
    users {
        text id PK
        text email UK
        text passwordHash
        text name
        text role
        text organization
        timestamp createdAt
    }

    session {
        varchar sid PK
        json sess
        timestamp expire
    }

    incidents {
        text id PK
        text name
        text disasterType
        text status
        text severity
        jsonb aoi
        timestamp startTime
        timestamp endTime
        text source
        integer version
    }

    imagery_assets {
        text id PK
        text incidentId FK
        text provider
        text sensorType
        timestamp acquisitionTime
        real spatialResolution
        jsonb bounds
        text rawStoragePath
    }

    imagery_pairs {
        text id PK
        text incidentId FK
        text preImageryId FK
        text postImageryId FK
        text analysisMethod
    }

    critical_assets {
        text id PK
        text name
        text type
        jsonb location
        integer criticalityScore
        integer capacity
    }

    detections {
        text id PK
        text incidentId FK
        text imageryAssetId FK
        text hazardType
        text severity
        real confidenceScore
        jsonb geometry
        text modelName
    }

    cases {
        text id PK
        text incidentId FK
        text detectionId FK
        text criticalAssetId FK
        text status
        integer priorityScore
        jsonb priorityBreakdown
        integer version
    }

    evidence {
        text id PK
        text caseId FK
        text fileName
        text mimeType
        integer fileSizeBytes
        text sha256Hash
        text storagePath
    }

    reviews {
        text id PK
        text caseId FK
        text reviewerId FK
        text decision
        text notes
        integer version
    }

    tasks {
        text id PK
        text caseId FK
        text title
        text taskType
        text status
        text assignedUnit
        timestamp slaDeadline
        integer version
    }

    field_observations {
        text id PK
        text caseId FK
        text taskId FK
        text userId FK
        text verificationStatus
        jsonb groundPhotos
        jsonb location
    }

    outcomes {
        text id PK
        text caseId FK
        text finalStatus
        text afterActionNotes
        integer reliefSuppliesDelivered
    }

    case_status_history {
        text id PK
        text caseId FK
        text fromStatus
        text toStatus
        text userId FK
        integer version
    }

    audit_events {
        text id PK
        text actorId
        text action
        text entityType
        text entityId
        jsonb metadata
    }

    outbox_events {
        text id PK
        text eventType
        text entityType
        text entityId
        integer version
        jsonb payload
        text status
    }

    incidents ||--o{ imagery_assets : "has"
    incidents ||--o{ imagery_pairs : "contains"
    incidents ||--o{ detections : "identifies"
    incidents ||--o{ cases : "encapsulates"

    imagery_assets ||--o{ detections : "analyzed_in"
    imagery_assets ||--o{ imagery_pairs : "paired_as_pre"
    imagery_assets ||--o{ imagery_pairs : "paired_as_post"

    detections ||--o| cases : "triggers"
    critical_assets ||--o{ cases : "impacted_in"

    cases ||--o{ evidence : "attaches"
    cases ||--o{ reviews : "adjudicated_by"
    cases ||--o{ tasks : "spawns"
    cases ||--o{ field_observations : "verified_by"
    cases ||--o{ case_status_history : "records_history"
    cases ||--o| outcomes : "concludes_with"

    tasks ||--o{ field_observations : "directs"
    users ||--o{ reviews : "conducts"
    users ||--o{ field_observations : "submits"
    users ||--o{ case_status_history : "transitions"
\`\`\`
`);

  // ===========================================================================
  // 07-authentication
  // ===========================================================================

  // 07-authentication/01-auth-rbac.md
  writeFile(docsDir, '07-authentication/01-auth-rbac.md', `---
id: auth-rbac
title: Authentication, Sessions & RBAC Matrix
sidebar_label: Authentication & RBAC
sidebar_position: 1
---

# Authentication, Sessions & RBAC Matrix

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces session-based authentication backed by PostgreSQL and a granular 6-tier Role-Based Access Control (RBAC) model designed for emergency management hierarchies.

---

## Session Management Architecture

- **Session Store**: \`connect-pg-simple\` storing active sessions directly in the PostgreSQL \`session\` table.
- **Session Cookie**: \`connect.sid\`, signed using \`SESSION_SECRET\`.
- **Security Flags**:
  - \`httpOnly: true\` (prevents JavaScript XSS cookie extraction).
  - \`secure: NODE_ENV === 'production'\` (requires HTTPS in production).
  - \`sameSite: 'lax'\` (protects against Cross-Site Request Forgery).
  - \`maxAge: 30 * 24 * 60 * 60 * 1000\` (30-day session lifetime).

---

## 6 System Roles & Operational Clearance

| Role Identifier | Operational Title | Primary Mission & Responsibilities |
| :--- | :--- | :--- |
| **System Administrator** | System Administrator | Infrastructure management, external API credentials, user directory, system configuration. |
| **Incident Commander** | Incident Commander | Strategic authority. Declares incident states, authorizes high-risk tasks, approves final after-action outcomes. |
| **Duty Officer** | EOC Duty Officer | Operational watchstander. Triages AI candidate detections, reviews evidence, confirms cases, sets task priorities. |
| **GIS Analyst** | Geospatial Intelligence Analyst | Manages satellite imagery swaths, AOI polygons, Overpass OSM sync, runs change-detection workflows. |
| **Field Lead** | Tactical Field Coordinator | Assigns response tasks to field teams, monitors SLA adherence, validates incoming field observations. |
| **Field Responder** | Ground Operations Responder | Operates mobile PWA in disaster zone. Executes on-site damage verification, captures geotagged photos. |

---

## RBAC Permissions Matrix Across API Endpoints

| Resource & Operation | Endpoint | Permitted Roles |
| :--- | :--- | :--- |
| **View Command Center** | \`GET /api/operations/summary\` | All Authenticated Roles |
| **Create Incident** | \`POST /api/incidents\` | \`System Administrator\`, \`Incident Commander\` |
| **Update Incident Status**| \`PATCH /api/incidents/:id\` | \`Incident Commander\` |
| **STAC Satellite Search** | \`POST /api/imagery/search\` | \`GIS Analyst\`, \`Incident Commander\` |
| **Trigger OSM Overpass** | \`POST /api/integrations/osm/sync\`| \`GIS Analyst\`, \`System Administrator\` |
| **Adjudicate AI Case** | \`POST /api/cases/:id/review\` | \`Duty Officer\`, \`Incident Commander\` |
| **Spawn Task from Case** | \`POST /api/tasks\` | \`Duty Officer\`, \`Incident Commander\`, \`Field Lead\` |
| **Update Task Status** | \`PATCH /api/tasks/:id\` | \`Field Lead\`, \`Incident Commander\` |
| **Submit Field Observation**| \`POST /api/field/observations\` | \`Field Responder\`, \`Field Lead\` |
| **Upload File Evidence** | \`POST /api/evidence\` | All Authenticated Roles |
| **Publish Outcome Report**| \`POST /api/outcomes\` | \`Incident Commander\` |
| **Manage Users & System** | \`POST /api/admin/users\` | \`System Administrator\` |

---

## Middleware Guards

**Source File**: \`artifacts/api-server/src/middlewares/auth.ts\`

\`\`\`typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication session required.' }
    });
  }
  next();
}

export function requireRole(...permittedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!permittedRoles.includes(req.session.role!)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Role ' + req.session.role + ' is not authorized for this operation.'
          }
        });
      }
      next();
    });
  };
}
\`\`\`
`);


  // ===========================================================================
  // 08-domain
  // ===========================================================================

  // 08-domain/01-case-lifecycle.md
  writeFile(docsDir, '08-domain/01-case-lifecycle.md', `---
id: case-lifecycle
title: Case Finite State Machine & Triage Lifecycle
sidebar_label: Case Lifecycle
sidebar_position: 1
---

# Case Finite State Machine & Triage Lifecycle

<span className="badge-implemented">Implemented</span>

The **Case** is the central operational unit of work in DRAXELYRA. Cases progress through a strict 10-state Finite State Machine (FSM) defined in \`artifacts/api-server/src/services/case-state-machine.ts\`.

\`\`\`mermaid
stateDiagram-v2
    [*] --> DETECTED : AI / External Sensor Ingestion
    DETECTED --> NEEDS_REVIEW : Automatic Spatial Enrichment
    
    NEEDS_REVIEW --> CONFIRMED : Duty Officer Adjudication
    NEEDS_REVIEW --> REJECTED : False Positive Dismissal
    NEEDS_REVIEW --> UNCERTAIN : Insufficient Telemetry

    CONFIRMED --> PRIORITIZED : 5-Factor Score Calculated
    CONFIRMED --> TASKED : Direct Task Assignment
    PRIORITIZED --> TASKED : Field Units Mobilized

    TASKED --> IN_PROGRESS : Team Deploys On-Site
    IN_PROGRESS --> FIELD_VERIFIED : Ground Truth Observation Uploaded
    IN_PROGRESS --> ACTIONED : Immediate Relief Provided
    
    FIELD_VERIFIED --> ACTIONED : Shoring / Drainage Executed
    ACTIONED --> CLOSED : Commander Signs After-Action
    REJECTED --> CLOSED : Logged to Training Archive
    UNCERTAIN --> CLOSED : Superseded by Drone Pass
    CLOSED --> [*]
\`\`\`

---

## Formal State Transition Table

| Current State | Allowed Next States | Required Actor Role | Guard Conditions & Actions |
| :--- | :--- | :--- | :--- |
| **\`DETECTED\`** | \`NEEDS_REVIEW\` | System / Ingestion | Generated upon ingestion of candidate anomaly; triggers OSM spatial intersection. |
| **\`NEEDS_REVIEW\`** | \`CONFIRMED\`, \`REJECTED\`, \`UNCERTAIN\` | \`Duty Officer\`, \`Commander\` | Mandatory review notes (>= 10 chars); records \`reviews\` entry. |
| **\`CONFIRMED\`** | \`PRIORITIZED\`, \`TASKED\` | \`Duty Officer\`, \`Commander\` | Computes explainable priority score (0 to 100); attaches priority breakdown. |
| **\`PRIORITIZED\`** | \`TASKED\` | \`Field Lead\`, \`Commander\` | Generates child \`tasks\` record with dynamic SLA deadline. |
| **\`TASKED\`** | \`IN_PROGRESS\` | \`Field Lead\`, \`Responder\` | Response team mobilized to target coordinates. |
| **\`IN_PROGRESS\`** | \`FIELD_VERIFIED\`, \`ACTIONED\` | \`Field Responder\` | Ground observation received with GPS coordinate and photo proof. |
| **\`FIELD_VERIFIED\`**| \`ACTIONED\` | \`Field Lead\` | Mitigation action completed (e.g., pump installed, levee reinforced). |
| **\`ACTIONED\`** | \`CLOSED\` | \`Incident Commander\` | Final outcome recorded in \`outcomes\` table. |
| **\`REJECTED\`** | \`CLOSED\` | \`Duty Officer\`, \`Commander\` | False positive logged into \`ai_evaluation_dataset\` for model tuning. |
| **\`UNCERTAIN\`** | \`CLOSED\` | \`Duty Officer\`, \`Commander\` | Archived pending higher-resolution reconnaissance. |
| **\`CLOSED\`** | *(None - Terminal)* | None | Immutable terminal state. |
`);


  // 08-domain/02-task-lifecycle.md
  writeFile(docsDir, '08-domain/02-task-lifecycle.md', `---
id: task-lifecycle
title: Task State Machine & Dynamic SLA Calculation
sidebar_label: Task Lifecycle
sidebar_position: 2
---

# Task State Machine & Dynamic SLA Calculation

<span className="badge-implemented">Implemented</span>

Tasks represent discrete physical or analytical work orders spawned from confirmed crisis cases. Tasks are governed by a 7-state FSM in \`artifacts/api-server/src/services/task-state-machine.ts\`.

\`\`\`mermaid
stateDiagram-v2
    [*] --> UNASSIGNED : Spawned from Case
    UNASSIGNED --> ASSIGNED : Unit Designated
    ASSIGNED --> IN_PROGRESS : Unit En Route / Working
    ASSIGNED --> UNASSIGNED : Unit Re-allocated
    
    IN_PROGRESS --> BLOCKED : Hazard / Access Cut Off
    BLOCKED --> IN_PROGRESS : Access Cleared
    BLOCKED --> UNASSIGNED : Re-tasked to Air Rescue
    
    IN_PROGRESS --> COMPLETED : Physical Work Finished
    COMPLETED --> VERIFIED : Field Lead Inspection
    VERIFIED --> CLOSED : After-Action Accepted
    COMPLETED --> CLOSED : Fast-Track Closure
    CLOSED --> [*]
\`\`\`

---

## Dynamic SLA Calculation Engine

**Source File**: [\`artifacts/api-server/src/services/task-state-machine.ts:80\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/task-state-machine.ts#L80-L98)

When a task is created from a confirmed case, its Service Level Agreement (SLA) deadline is computed dynamically from the parent case's Priority Score ($P$):

| Priority Score Range | Response Tier | SLA Window | Target Operational Benchmark |
| :--- | :--- | :--- | :--- |
| **P &ge; 85 (Critical)** | Tier 1 (Critical) | **4 Hours** | Immediate life-safety, hospital power loss, flood breach. |
| **65 to 84 (High)** | Tier 2 (High) | **8 Hours** | Bridge structural washouts, major transit arterial cut. |
| **40 to 64 (Moderate)** | Tier 3 (Moderate) | **16 Hours** | Residential neighborhood inundation, shelter supply delivery. |
| **0 to 39 (Routine)** | Tier 4 (Routine) | **36 Hours** | Secondary debris clearance, agricultural drainage survey. |


\`\`\`typescript
export function computeSlaDeadline(priorityScore: number): Date {
  const now = Date.now();
  let hours = 36;
  if (priorityScore >= 85) hours = 4;
  else if (priorityScore >= 65) hours = 8;
  else if (priorityScore >= 40) hours = 16;

  return new Date(now + hours * 60 * 60 * 1000);
}
\`\`\`
`);

  // 08-domain/03-priority-engine.md
  writeFile(docsDir, '08-domain/03-priority-engine.md', `---
id: priority-engine
title: Deterministic 5-Factor Priority Scoring Engine
sidebar_label: Priority Engine
sidebar_position: 3
---

# Deterministic 5-Factor Priority Scoring Engine

<span className="badge-implemented">Implemented</span>

DRAXELYRA rejects opaque black-box prioritization. The Priority Engine computes a fully deterministic, explainable score between 0 and 100 using a transparent mathematical formulation implemented in \`artifacts/api-server/src/lib/priority.ts\`.

---

## The Mathematical Formula

\`\`\`text
Priority Score (P) = round( 0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * (K * 100) )
\`\`\`

Where:
- **S = Structural Damage Severity Score** (0 to 100)
- **C = Critical Infrastructure Score** (0 to 100)
- **E = Exposed Population / Density Score** (0 to 100)
- **U = Urgency & Access Constraint Score** (0 to 100)
- **K = AI Model Confidence Metric** (0.00 to 1.00)

---

## Exact Factor Weight Matrices

### 1. Severity Weight (S) — 30% Weight
Derived from optical spectral classification or SAR backscatter loss:
- \`DESTROYED\` -> 100
- \`SEVERE\` -> 75
- \`MODERATE\` -> 45
- \`UNCERTAIN\` -> 35
- \`MINOR\` -> 20
- \`NO_DAMAGE\` -> 0

### 2. Criticality Weight (C) — 25% Weight
Derived from impacted OpenStreetMap infrastructure:
- \`HOSPITAL\`, \`EMERGENCY_SERVICES\`, \`TRAUMA_CENTER\` -> 100
- \`BRIDGE\`, \`EVACUATION_ROUTE\`, \`AIRPORT\` -> 85
- \`POWER_SUBSTATION\`, \`WATER_TREATMENT\`, \`CELL_TOWER\` -> 75
- \`SCHOOL\`, \`COMMUNITY_SHELTER\` -> 70
- \`RESIDENTIAL_HIGH_DENSITY\` -> 40
- \`COMMERCIAL_INDUSTRIAL\` -> 30
- \`DEFAULT_UNCLASSIFIED\` -> 15

### 3. Exposure Weight (E) — 20% Weight
Derived from LandScan / WorldPop gridded population density within the 500m hazard buffer:
- \`HIGH\` (> 500 persons/hectare) -> 90
- \`MEDIUM\` (100 to 500 persons/hectare) -> 55
- \`LOW\` (< 100 persons/hectare) -> 20

### 4. Urgency Weight (U) — 15% Weight
Implements a 72-hour exponential decay curve with access constraint penalties:
\`\`\`text
U = min(100, max(0, 100 - (hoursElapsed / 72) * 100) + (accessConstrained ? 20 : 0))
\`\`\`

### 5. Statistical Confidence (K) — 10% Weight
The direct confidence probability (0.0 to 1.0) generated by the multimodal AI model multiplied by 100.

---

## Worked Calculation Example

**Scenario**: A major hospital is flooded (Severe Damage) 4 hours after a cyclone. Population exposure is High. Access roads are blocked. Model confidence is 0.92.

- S = 75 (Severe)
- C = 100 (Hospital)
- E = 90 (High Exposure)
- U = min(100, max(0, 100 - (4/72)*100) + 20) = min(100, 94.4 + 20) = 100
- K = 0.92 -> 92

\`\`\`text
P = round( 0.30*(75) + 0.25*(100) + 0.20*(90) + 0.15*(100) + 0.10*(92) )
  = round( 22.5 + 25.0 + 18.0 + 15.0 + 9.2 )
  = round( 89.7 ) = 90  (Tier 1 Critical - 4h SLA)
\`\`\`
`);


  // 08-domain/04-evidence-audit.md
  writeFile(docsDir, '08-domain/04-evidence-audit.md', `---
id: evidence-audit
title: Evidence Ingestion & Cryptographic Audit Trails
sidebar_label: Evidence & Audit
sidebar_position: 4
---

# Evidence Ingestion & Cryptographic Audit Trails

<span className="badge-implemented">Implemented</span>

Disaster response operations produce sensitive forensic imagery, field verification photos, and life-critical decisions that must withstand rigorous post-incident judicial and after-action scrutiny.

---

## Evidence Upload Security Pipeline

**Source File**: [\`artifacts/api-server/src/routes/evidence.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/routes/evidence.ts)

Every file uploaded via \`POST /api/evidence\` traverses a strict validation sequence:

\`\`\`mermaid
flowchart TD
    UP["Upload Stream (Multer Memory Storage)"] --> SZ{"File Size <= 50MB?"}
    SZ -->|No| ERR1["HTTP 413 Payload Too Large"]
    SZ -->|Yes| MB{"Magic Byte MIME Verification"}
    
    MB -->|Invalid| ERR2["HTTP 415 Unsupported Media Type"]
    MB -->|Valid JPEG / PNG / WebP / MP4| HASH["Calculate SHA-256 Checksum"]
    
    HASH --> PATH["Sanitize Path & Disallow Directory Traversal"]
    PATH --> DISK["Write File to ./uploads/sha256.ext"]
    DISK --> DB[("Insert into evidence Table")]
    DB --> AUDIT[("Insert into audit_events Table")]

\`\`\`

---

## Magic Byte Signature Verification

File extensions and \`Content-Type\` headers supplied by browsers are untrusted and easily spoofed. DRAXELYRA inspects raw buffer magic bytes before writing to disk:

| Expected Format | Required Magic Byte Hex Signature |
| :--- | :--- |
| **JPEG** | \`FF D8 FF\` |
| **PNG** | \`89 50 4E 47 0D 0A 1A 0A\` |
| **WebP** | \`52 49 46 46\` (RIFF) + \`57 45 42 50\` (WEBP) at byte offset 8 |
| **MP4 Video** | \`66 74 79 70\` (\`ftyp\`) at byte offset 4 |

---

## Cryptographic Audit Logging

Every state transition, triage adjudication, task modification, and evidence upload automatically inserts an immutable record into \`audit_events\`:

\`\`\`typescript
await db.insert(auditEvents).values({
  id: 'aud_' + crypto.randomUUID(),
  actorId: req.session.userId,


  action: 'CASE_REVIEW_SUBMITTED',
  entityType: 'CASE',
  entityId: caseId,
  metadata: {
    decision: 'CONFIRMED',
    previousStatus: 'NEEDS_REVIEW',
    newStatus: 'CONFIRMED',
    priorityScore: 90,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
  createdAt: new Date(),
});
\`\`\`
`);

}

