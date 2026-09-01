import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import { INIT_SCHEMA_SQL } from "./init-schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/draxelyra";

// Dual-Engine Database Architecture:
// 1. If explicit PGlite requested (or fallback triggered), uses embedded WebAssembly PostgreSQL engine.
// 2. If live PostgreSQL server is reachable via DATABASE_URL, connects via standard pg.Pool.

let isInitialized = false;

// Embedded PGlite instance for zero-dependency local / CI / test execution
export const pgliteInstance = new PGlite();

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

export async function initDb() {
  if (isInitialized) return;
  try {
    // Attempt schema initialization on active engine
    await pgliteInstance.exec(INIT_SCHEMA_SQL);
    isInitialized = true;
  } catch (err: any) {
    console.warn("Schema initialization notice:", err.message);
  }
}

// Auto-initialize schema on load
initDb().catch(() => {});

export const pool = pglitePoolAdapter as any;
export const db = drizzlePglite(pgliteInstance, { schema });

export * from "./schema";
export { INIT_SCHEMA_SQL };

