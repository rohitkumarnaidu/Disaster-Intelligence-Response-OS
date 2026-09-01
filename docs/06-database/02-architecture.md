---
id: architecture
title: Database Connection Management & Strategy
sidebar_label: Database Architecture
sidebar_position: 2
---

# Database Connection Management & Strategy

<span className="badge-implemented">Implemented</span>

DRAXELYRA manages PostgreSQL persistence through a dedicated, type-safe package (`@workspace/db`) located in `lib/db/`.

---

## Connection Pooling & Drizzle Instance

**Source File**: [`lib/db/src/index.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/lib/db/src/index.ts)

The database client utilizes `pg.Pool` to maintain a pool of reusable TCP connections to PostgreSQL, preventing connection exhaustion during high-concurrency disaster alerts.

```typescript
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
```

---

## Spatial Geometry Strategy: JSONB vs PostGIS

DRAXELYRA intentionally stores geospatial geometries (AOI boundaries, asset coordinates, detection polygons) as standard GeoJSON in PostgreSQL `jsonb` columns rather than requiring the native `PostGIS` binary extension:

1. **Zero-Dependency Portability**: Allows running on standard managed PostgreSQL instances (AWS Aurora, Google Cloud SQL, Neon, Supabase, Local Docker) without requiring compiled C binary extensions.
2. **Native JavaScript / TypeScript Interoperability**: GeoJSON objects serialize and deserialize natively without binary WKB (Well-Known Binary) encoding/decoding overhead.
3. **Indexable Topologies**: Critical bounding boxes and coordinates are indexed using PostgreSQL GIN (Generalized Inverted Index) operators:
   ```sql
   CREATE INDEX idx_cases_location ON cases USING gin (location);
   ```
