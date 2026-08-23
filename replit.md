# DRAXELYRA

DRAXELYRA turns post-disaster imagery into explainable priorities, accountable response tasks, and verified outcomes for emergency management teams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/draxelyra` — React/Vite command-center web app and shared dark operations-console theme.
- `artifacts/api-server/src/routes/operations.ts` — demo operations API.
- `artifacts/api-server/src/routes/demo-data.ts` — deterministic Chennai flood replay dataset.
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and schemas.
- `lib/db/src/schema` — reserved for persistent Drizzle schema as the demo moves beyond in-memory replay.

## Architecture decisions

- The first usable slice keeps the replay data in the API process so the judged flow works without a database migration blocking the UI; the API contract remains OpenAPI-first.
- The demo is explicitly historical/synthetic and uses a Chennai-type urban flood AOI; it does not claim live emergency intelligence.
- Priority is represented as deterministic factor data so the UI can show the evidence-to-action rationale rather than a black-box confidence number.

## Product

The app includes a command center, incident and map workspaces, priority queue, evidence review, response tasking, field verification/offline states, analytics, deterministic replay, and settings for mock adapters.

## User preferences

No explicit preferences recorded.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- API routes are mounted under `/api`; the web artifact is routed at `/`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
