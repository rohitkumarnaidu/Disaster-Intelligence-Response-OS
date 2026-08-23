# Database Overview

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes **PostgreSQL 15** managed through **Drizzle ORM** (`lib/db`). The database stores operational entities, geospatial geometries (in GeoJSON format), binary evidence metadata, user sessions, and immutable audit logs.

---

## Technical Stack & Connection Pooling

- **Database Engine**: PostgreSQL 15+
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Connection Pooling**: `pg.Pool` in `lib/db/src/index.ts`
- **Session Table**: Managed via `connect-pg-simple` with automatic cookie expiration cleanup
- **Schema Location**: `lib/db/src/schema/index.ts`
