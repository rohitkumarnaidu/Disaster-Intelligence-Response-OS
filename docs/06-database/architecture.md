# Database Architecture

<span className="badge-implemented">Implemented</span>

## Database Connection
We use `pg.Pool` for connecting to the database and pass the pool to `drizzle` to create the ORM instance.

Source file: `lib/db/src/index.ts`
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

## Drizzle ORM usage
Drizzle handles all schema definition, querying, and migrations. Relations between tables are explicitly defined to allow relational queries.
Migrations are generated and applied via the Drizzle CLI.
