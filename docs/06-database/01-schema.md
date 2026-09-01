---
id: schema
title: Relational Database Schema Specification
sidebar_label: Schema Specification
sidebar_position: 1
---

# Relational Database Schema Specification

<span className="badge-implemented">Implemented</span>

The DRAXELYRA relational database schema is implemented using TypeScript-native **Drizzle ORM** in `lib/db/src/schema/index.ts`. It comprises 18 production tables managing system state, geospatial intelligence, triage workflows, and transactional audit trails.

---

## 1. `users` & `session` Tables

### `users`
Stores operator credentials, organizational assignments, and role-based clearance levels.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique user identifier (e.g., `usr_commander_1`). |
| `email` | `text` | `NOT NULL, UNIQUE` | Operator email address for login. |
| `passwordHash` | `text` | `NOT NULL` | Salted password hash. |
| `name` | `text` | `NOT NULL` | Full operational display name. |
| `role` | `text` | `NOT NULL` | Role: `Incident Commander`, `Duty Officer`, `GIS Analyst`, etc. |
| `organization` | `text` | `NOT NULL` | Agency/Unit (e.g., `NDMA Response Team Alpha`). |
| `createdAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Account creation timestamp. |
| `updatedAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Account last modification timestamp. |

### `session`
PostgreSQL-backed session table managed via `connect-pg-simple`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `sid` | `varchar(255)` | `PRIMARY KEY` | Signed session ID from `connect.sid` cookie. |
| `sess` | `json` | `NOT NULL` | Serialized session object containing `userId`, `role`, and `org`. |
| `expire` | `timestamp(6)` | `NOT NULL, INDEX` | Session expiration timestamp for automated garbage collection. |

---

## 2. `incidents` Table

Represents the root operational crisis aggregate (e.g., Cyclone Remal, Assam Floods 2024).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique incident ID (e.g., `inc_remal_2024`). |
| `name` | `text` | `NOT NULL` | Official operational name of the incident. |
| `disasterType`| `text` | `NOT NULL` | Hazard: `FLOOD`, `CYCLONE`, `EARTHQUAKE`, `WILDFIRE`, `LANDSLIDE`. |
| `status` | `text` | `NOT NULL, DEFAULT 'ACTIVE'` | Status: `ACTIVE`, `MONITORING`, `RESOLVED`, `ARCHIVED`. |
| `severity` | `text` | `NOT NULL, DEFAULT 'WARNING'` | Severity level: `WATCH`, `ADVISORY`, `WARNING`, `CRITICAL`. |
| `aoi` | `jsonb` | `NOT NULL` | GeoJSON `Polygon` or `MultiPolygon` defining the Area of Interest. |
| `startTime` | `timestamp` | `NOT NULL` | Time when the crisis event initiated. |
| `endTime` | `timestamp` | `NULLABLE` | Time when the incident was marked resolved. |
| `source` | `text` | `NOT NULL` | Originating agency: `NDMA SACHET`, `IMD`, `USGS`, `MANUAL`. |
| `description` | `text` | `NULLABLE` | Operational synopsis and tactical objectives. |
| `version` | `integer` | `NOT NULL, DEFAULT 1` | Monotonic OCC version counter. |
| `createdAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Creation timestamp. |
| `updatedAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Last update timestamp. |

---

## 3. `imagery_assets` & `imagery_pairs`

### `imagery_assets`
Metadata registry for ingested satellite swaths, drone orthomosaics, and aerial rasters.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique imagery asset identifier. |
| `incidentId` | `text` | `FK -> incidents(id)` | Associated incident theater. |
| `provider` | `text` | `NOT NULL` | Provider: `COPERNICUS_SENTINEL_1`, `COPERNICUS_SENTINEL_2`, `PLANET`. |
| `sensorType` | `text` | `NOT NULL` | Modality: `OPTICAL`, `SAR_C_BAND`, `INFRARED`, `RGB_DRONE`. |
| `acquisitionTime` | `timestamp` | `NOT NULL` | Exact UTC sensor capture time. |
| `spatialResolution` | `real` | `NOT NULL` | Ground sample distance (meters per pixel, e.g., `10.0`). |
| `cloudCover` | `real` | `NULLABLE` | Percentage cloud obscuration ($0.0	ext{--}100.0$). |
| `bounds` | `jsonb` | `NOT NULL` | GeoJSON bounding polygon for the raster swath. |
| `thumbnailUrl` | `text` | `NULLABLE` | Fast web-optimized RGB preview crop URL. |
| `rawStoragePath` | `text` | `NOT NULL` | Filesystem path or object store URI of original COG / SAFE archive. |

### `imagery_pairs`
Links pre-disaster baseline imagery with post-disaster acquisition for change detection.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique imagery pair identifier. |
| `incidentId` | `text` | `FK -> incidents(id)` | Associated incident. |
| `preImageryId` | `text` | `FK -> imagery_assets(id)` | Baseline pre-event reference asset. |
| `postImageryId` | `text` | `FK -> imagery_assets(id)` | Target post-event damage asset. |
| `analysisMethod`| `text` | `NOT NULL` | Method: `SAR_COHERENCE_LOSS`, `NDWI_WATER_EXTRACTION`, `VLM_DAMAGE`. |

---

## 4. `critical_assets` & `osm_critical_assets`

Maintains geographic locations, facility types, and baseline capacities of life-critical infrastructure.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique asset identifier (e.g., `asset_hosp_silchar`). |
| `name` | `text` | `NOT NULL` | Facility name (e.g., `Silchar Medical College & Hospital`). |
| `type` | `text` | `NOT NULL` | Category: `HOSPITAL`, `BRIDGE`, `POWER_SUBSTATION`, `WATER_TREATMENT`. |
| `location` | `jsonb` | `NOT NULL` | GeoJSON `Point` coordinate `[longitude, latitude]`. |
| `criticalityScore` | `integer` | `NOT NULL` | Base criticality weight ($0	ext{--}100$, Hospital=100, Bridge=85). |
| `capacity` | `integer` | `NULLABLE` | Bed count, power megawatt rating, or throughput. |
| `metadata` | `jsonb` | `DEFAULT '{}'` | Ingested OSM tags (e.g., `phone`, `operator`, `backup_generator`). |

---

## 5. `detections` & `cases`

### `detections`
Raw machine-generated candidate damage anomalies produced by computer vision models.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique detection ID (e.g., `det_89201`). |
| `incidentId` | `text` | `FK -> incidents(id)` | Associated incident. |
| `imageryAssetId` | `text` | `FK -> imagery_assets(id)` | Imagery swath where anomaly was identified. |
| `hazardType` | `text` | `NOT NULL` | Hazard: `INUNDATION`, `STRUCTURAL_COLLAPSE`, `ROAD_WASHOUT`. |
| `severity` | `text` | `NOT NULL` | Model classification: `DESTROYED`, `SEVERE`, `MODERATE`, `MINOR`. |
| `confidenceScore`| `real` | `NOT NULL` | Statistical confidence ($0.00	ext{--}1.00$). |
| `geometry` | `jsonb` | `NOT NULL` | GeoJSON `Polygon` or `Point` of the damage footprint. |
| `modelName` | `text` | `NOT NULL` | Model: `gemini-2.5-flash` or `draxelyra-cv-baseline-v2`. |
| `modelOutput` | `jsonb` | `NOT NULL` | Raw parsed JSON response from AI provider. |

### `cases`
The core actionable operational aggregate tracking human review, prioritization, and response.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Operational case identifier (e.g., `C-1048`). |
| `incidentId` | `text` | `FK -> incidents(id)` | Associated incident theater. |
| `detectionId` | `text` | `FK -> detections(id)` | Originating AI candidate detection. |
| `criticalAssetId` | `text` | `FK -> critical_assets(id)` | Impacted critical infrastructure (if any). |
| `status` | `text` | `NOT NULL, DEFAULT 'DETECTED'` | FSM Status: `DETECTED`, `NEEDS_REVIEW`, `CONFIRMED`, `TASKED`, `CLOSED`. |
| `priorityScore`| `integer` | `NOT NULL` | Computed explainable priority ($0	ext{--}100$). |
| `priorityBreakdown` | `jsonb` | `NOT NULL` | JSON object containing 5 factor sub-scores ($S, C, E, U, K$). |
| `urgencyHours` | `integer` | `NOT NULL, DEFAULT 0` | Elapsed hours since hazard onset for time decay. |
| `assignedTo` | `text` | `FK -> users(id)` | Assigned responder or lead analyst. |
| `version` | `integer` | `NOT NULL, DEFAULT 1` | Monotonic OCC version counter. |
| `createdAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Creation timestamp. |
| `updatedAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Last transition timestamp. |

---

## 6. `tasks` & `field_observations`

### `tasks`
Specific operational work orders dispatched to field rescue teams or relief units.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique task identifier (e.g., `TSK-4091`). |
| `caseId` | `text` | `FK -> cases(id)` | Originating confirmed case. |
| `title` | `text` | `NOT NULL` | Task title (e.g., `Deploy High-Capacity De-Watering Pumps`). |
| `taskType` | `text` | `NOT NULL` | Type: `EVACUATION`, `DEWATERING`, `STRUCTURAL_SHORING`, `AID_DROP`. |
| `status` | `text` | `NOT NULL, DEFAULT 'UNASSIGNED'` | FSM: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `VERIFIED`. |
| `assignedUnit` | `text` | `NULLABLE` | Tactical unit (e.g., `NDRF 1st Battalion Team B`). |
| `slaDeadline` | `timestamp` | `NOT NULL` | Dynamic SLA deadline calculated from priority score. |
| `version` | `integer` | `NOT NULL, DEFAULT 1` | Monotonic OCC version counter. |
| `completedAt` | `timestamp` | `NULLABLE` | Timestamp when task reached completed state. |

### `field_observations`
Ground truth observations, photos, and sensor measurements submitted by field personnel.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique observation ID. |
| `caseId` | `text` | `FK -> cases(id)` | Target case. |
| `taskId` | `text` | `FK -> tasks(id)` | Associated response task. |
| `userId` | `text` | `FK -> users(id)` | Field responder author ID. |
| `verificationStatus` | `text` | `NOT NULL` | Status: `CONFIRMED_DAMAGED`, `NO_DAMAGE_FOUND`, `INACCESSIBLE`. |
| `groundPhotos` | `jsonb` | `DEFAULT '[]'` | Array of uploaded photo evidence URLs. |
| `waterDepthCm` | `integer` | `NULLABLE` | Physical measured flood depth in centimeters. |
| `location` | `jsonb` | `NOT NULL` | GeoJSON `Point` captured via field device GPS. |
| `capturedAt` | `timestamp` | `NOT NULL` | Offline capture timestamp on field device. |
| `syncedAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Timestamp when record was received by server. |

---

## 7. `outbox_events` & `audit_events`

### `outbox_events`
Transactional outbox enabling guaranteed event delivery to WebSockets and SSE.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique event UUID. |
| `eventType` | `text` | `NOT NULL` | Event: `CASE_CONFIRMED`, `TASK_ASSIGNED`, `INCIDENT_UPDATED`. |
| `entityType` | `text` | `NOT NULL` | Entity: `CASE`, `TASK`, `INCIDENT`, `OBSERVATION`. |
| `entityId` | `text` | `NOT NULL` | Target entity ID. |
| `version` | `integer` | `NOT NULL` | Entity OCC version at time of event emission. |
| `payload` | `jsonb` | `NOT NULL` | Complete domain event payload. |
| `status` | `text` | `NOT NULL, DEFAULT 'PENDING'` | Status: `PENDING`, `DISPATCHED`, `FAILED`. |
| `createdAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Database insertion timestamp. |
| `dispatchedAt` | `timestamp` | `NULLABLE` | Outbox dispatcher broadcast timestamp. |

### `audit_events`
Immutable audit ledger recording all security and operational mutations across the system.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | `PRIMARY KEY` | Unique audit log ID. |
| `actorId` | `text` | `NOT NULL` | User ID or `SYSTEM_CRON` executing the mutation. |
| `action` | `text` | `NOT NULL` | Action: `REVIEW_SUBMITTED`, `TASK_TRANSITIONED`, `EVIDENCE_UPLOADED`. |
| `entityType` | `text` | `NOT NULL` | Entity category. |
| `entityId` | `text` | `NOT NULL` | Entity ID. |
| `metadata` | `jsonb` | `DEFAULT '{}'` | Previous vs new state diff, IP address, and client user-agent. |
| `createdAt` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Immutable event timestamp. |
