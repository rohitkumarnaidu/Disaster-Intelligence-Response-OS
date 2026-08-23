---
id: local-development
title: Local Development
sidebar_position: 3
---

# Local Development Workflow

<span className="badge-implemented">Implemented</span>

DRAXELYRA is structured as a multi-tier monorepo. During local development, the PostgreSQL database, Express API server, and Vite frontend run concurrently.

---

## 1. Start the PostgreSQL Database

You can run PostgreSQL locally or launch the bundled Docker Compose service:

```bash
docker compose up -d
```

This starts PostgreSQL 15 on port `5433` (mapped from container port 5432) with database name `draxelyra`.

---

## 2. Push Database Schema & Migrations

Push the Drizzle ORM schema to the local PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

---

## 3. Run API Server & Frontend Concurrently

Run the primary development script from the workspace root:

```bash
pnpm run dev
```

This executes:
1. `pnpm -F @workspace/db run push` (Synchronizes schema)
2. `pnpm -F @workspace/api-server run dev` (Starts Express server on `http://localhost:5000`)
3. `pnpm -F @workspace/draxelyra run dev` (Starts Vite command console on `http://localhost:5173` or configured dev port)

---

## 4. Available Monorepo Scripts

| Command | Action |
| :--- | :--- |
| `pnpm run dev` | Starts DB sync, Express backend, and Vite frontend. |
| `pnpm run build` | Runs TypeScript checks and builds all packages. |
| `pnpm run typecheck` | Executes `tsc` across all libraries and artifacts. |
| `pnpm run test` | Runs Vitest test suites. |
| `pnpm run docs:dev` | Starts the Docusaurus documentation website locally. |
| `pnpm run docs:build` | Compiles static documentation site for deployment. |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerates API client hooks & Zod schemas from `openapi.yaml`. |
