import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import { INIT_SCHEMA_SQL } from "./init-schema";

const { Pool } = pg;

const hasExplicitDbUrl = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5433"));

let isInitialized = false;

// Embedded PGlite instance for zero-dependency local / CI / test execution
export const pgliteInstance = new PGlite();

// Real PostgreSQL Pool if DATABASE_URL configured
let realPool: pg.Pool | null = null;
if (hasExplicitDbUrl) {
  try {
    realPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") || process.env.DATABASE_URL?.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
      max: 10,
    });
  } catch (e) {
    console.warn("Failed to construct pg.Pool, using PGlite fallback", e);
  }
}

// Adapter to provide standard pg.Pool interface over PGlite
export const pglitePoolAdapter = {
  async query(text: string | { text: string; values?: any[] }, values?: any[]) {
    const queryText = typeof text === "string" ? text : text.text;
    const queryValues = typeof text === "string" ? values : text.values;
    try {
      const res = await pgliteInstance.query(queryText, queryValues);
      return {
        rows: res.rows || [],
        rowCount: res.rows?.length || 0,
        fields: res.fields || [],
        command: "SELECT",
      };
    } catch (err) {
      throw err;
    }
  },
  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {},
    };
  },
  on() {
    return this;
  },
  async end() {
    return pgliteInstance.close();
  },
};

export const pool = realPool || (pglitePoolAdapter as any);
export const db = (realPool
  ? drizzleNodePg(realPool, { schema })
  : drizzlePglite(pgliteInstance, { schema })) as ReturnType<typeof drizzlePglite<typeof schema>>;

export async function initDb() {
  if (isInitialized) return;
  try {
    if (realPool) {
      await realPool.query(INIT_SCHEMA_SQL);
    } else {
      await pgliteInstance.exec(INIT_SCHEMA_SQL);
    }
    isInitialized = true;
  } catch (err: any) {
    console.warn("Schema initialization notice:", err.message);
    if (realPool) {
      try {
        await pgliteInstance.exec(INIT_SCHEMA_SQL);
      } catch (_) {}
    }
  }
}

// Auto-initialize schema on load
initDb().catch(() => {});

export * from "./schema";
export { INIT_SCHEMA_SQL };

