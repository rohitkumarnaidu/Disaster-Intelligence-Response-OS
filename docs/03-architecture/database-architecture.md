# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** managed through **Drizzle ORM** (`lib/db`). The schema enforces referential integrity, optimistic concurrency versioning, and immutable audit logs.

```mermaid
erDiagram
    USERS ||--o{ INCIDENTS : "creates"
    USERS ||--o{ CASES : "owns"
    USERS ||--o{ TASKS : "assigned_to"
    USERS ||--o{ REVIEWS : "reviews"
    USERS ||--o{ AUDIT_EVENTS : "acts_in"

    INCIDENTS ||--o{ IMAGERY_ASSETS : "contains"
    INCIDENTS ||--o{ DETECTIONS : "contains"
    INCIDENTS ||--o{ CASES : "contains"

    IMAGERY_ASSETS ||--o{ DETECTIONS : "source_for"
    CRITICAL_ASSETS ||--o{ CASES : "target_of"
    DETECTIONS ||--o{ CASES : "triggers"

    CASES ||--o{ EVIDENCE : "has"
    CASES ||--o{ REVIEWS : "has"
    CASES ||--o{ TASKS : "spawns"
    CASES ||--o{ FIELD_OBSERVATIONS : "verified_by"
    CASES ||--o{ CASE_STATUS_HISTORY : "tracks"
    CASES ||--o{ OUTCOMES : "concludes"
```
