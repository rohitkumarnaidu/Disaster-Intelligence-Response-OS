---
id: er-diagram
title: Complete Entity-Relationship (ER) Diagram
sidebar_label: ER Diagram
sidebar_position: 4
---

# Complete Entity-Relationship (ER) Diagram

<span className="badge-implemented">Implemented</span>

The complete 18-table Entity-Relationship diagram below reflects all primary keys, foreign keys, and cardinality relationships implemented in `lib/db/src/schema/index.ts`.

```mermaid
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
```
