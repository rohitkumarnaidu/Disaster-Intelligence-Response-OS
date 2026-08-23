# Database Schema

<span className="badge-implemented">Implemented</span>

## Overview
The DRAXELYRA platform utilizes PostgreSQL as its primary datastore, leveraging **Drizzle ORM** for schema definition and migrations. The schema encompasses 15 tables that form the foundation for tracking users, incidents, detections, and case lifecycles.

Source file: `lib/db/src/schema/index.ts`

## Tables

### 1. `users`
- **id**: `text` (PK)
- **name**: `text`
- **email**: `text` (unique)
- **passwordHash**: `text`
- **role**: `text`
- **organizationId**: `text`
- **createdAt**: `timestamp`

### 2. `organizations`
- **id**: `text` (PK)
- **name**: `text`
- **type**: `text`

### 3. `incidents`
- **id**: `text` (PK)
- **name**: `text`
- **disasterType**: `text`
- **status**: `text`
- **startTime**: `timestamp`
- **endTime**: `timestamp`
- **aoi**: `jsonb` (GeoJSON)
- **source**: `text`
- **description**: `text`
- **severity**: `text`
- **createdBy**: `text` (FK `users`)
- **createdAt**: `timestamp`
- **updatedAt**: `timestamp`

### 4. `imageryAssets`
- **id**: `text` (PK)
- **incidentId**: `text` (FK `incidents`)
- **filename**: `text`
- **source**: `text`
- **acquisitionTime**: `timestamp`
- **captureType**: `text`
- **geometry**: `jsonb`
- **qualityStatus**: `text`
- **storagePath**: `text`
- **metadata**: `jsonb`
- **processingStatus**: `text`

### 5. `criticalAssets`
- **id**: `text` (PK)
- **name**: `text`
- **type**: `text`
- **location**: `jsonb` (`{lat, lng}`)
- **criticalityScore**: `number`
- **populationExposureTier**: `text`

### 6. `detections`
- **id**: `text` (PK)
- **incidentId**: `text` (FK `incidents`)
- **imageryId**: `text` (FK `imageryAssets`)
- **geometry**: `jsonb`
- **class**: `text`
- **severity**: `text`
- **confidence**: `doublePrecision`
- **modelName**: `text`
- **modelVersion**: `text`
- **inferenceTimestamp**: `timestamp`

### 7. `cases`
- **id**: `text` (PK)
- **incidentId**: `text` (FK `incidents`)
- **detectionId**: `text` (FK `detections`)
- **assetId**: `text` (FK `criticalAssets`)
- **status**: `text`
- **priorityScore**: `doublePrecision`
- **priorityBreakdown**: `jsonb`
- **reviewState**: `text`
- **owner**: `text` (FK `users`)
- **version**: `int` (default 1)
- **createdAt**: `timestamp`
- **updatedAt**: `timestamp`

### 8. `evidence`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **type**: `text`
- **uri**: `text`
- **source**: `text`
- **mimeType**: `text`
- **size**: `int`
- **checksum**: `text` (SHA-256)
- **metadata**: `jsonb`
- **createdBy**: `text` (FK `users`)
- **timestamp**: `timestamp`

### 9. `reviews`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **reviewer**: `text` (FK `users`)
- **decision**: `text`
- **reason**: `text`
- **notes**: `text`
- **createdAt**: `timestamp`

### 10. `tasks`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **title**: `text`
- **description**: `text`
- **priority**: `int`
- **assignedTeam**: `text`
- **assignedUser**: `text` (FK `users`)
- **status**: `text`
- **version**: `int` (default 1)
- **createdAt**: `timestamp`
- **dueAt**: `timestamp`
- **escalationAt**: `timestamp`
- **completedAt**: `timestamp`

### 11. `fieldObservations`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **taskId**: `text` (FK `tasks`)
- **location**: `jsonb`
- **media**: `jsonb`
- **notes**: `text`
- **verificationStatus**: `text`
- **syncStatus**: `text`
- **version**: `int` (default 1)
- **createdAt**: `timestamp`

### 12. `outcomes`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **action**: `text`
- **result**: `text`
- **evidence**: `jsonb`
- **completedBy**: `text` (FK `users`)
- **completedAt**: `timestamp`

### 13. `caseStatusHistory`
- **id**: `text` (PK)
- **caseId**: `text` (FK `cases`)
- **fromStatus**: `text`
- **toStatus**: `text`
- **user**: `text` (FK `users`)
- **reason**: `text`
- **timestamp**: `timestamp`

### 14. `auditEvents`
- **id**: `text` (PK)
- **actorId**: `text` (FK `users`)
- **entityType**: `text`
- **entityId**: `text`
- **action**: `text`
- **metadata**: `jsonb`
- **timestamp**: `timestamp`

### 15. `session`
- **sid**: `varchar` (PK)
- **sess**: `jsonb`
- **expire**: `timestamp`
*(Used for connect-pg-simple)*
