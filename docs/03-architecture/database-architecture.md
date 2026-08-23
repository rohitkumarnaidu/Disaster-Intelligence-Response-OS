# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** as its primary relational datastore with **Drizzle ORM** (`lib/db`) for schema definition, migrations, and query execution.

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
