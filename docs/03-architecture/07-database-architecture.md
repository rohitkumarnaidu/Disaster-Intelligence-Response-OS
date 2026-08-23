# Database Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes PostgreSQL as its primary datastore.

## Schema Highlights
- **Incidents**: The root aggregate.
- **Cases**: Belong to an incident. Track priority, status, and geospatial location.
- **Tasks**: Represent actionable work. Linked to cases.
- **Audit Events**: Immutable append-only log of critical system changes.

All mutable tables include a `version` column to support Optimistic Concurrency Control (OCC).\n