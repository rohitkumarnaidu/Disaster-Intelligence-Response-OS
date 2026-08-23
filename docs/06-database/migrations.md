---
id: migrations
title: Migrations
sidebar_position: 4
---

# Migrations & Schema Synchronization

<span className="badge-implemented">Implemented</span>

- **Development Schema Push**: `pnpm --filter @workspace/db run push`
- **Migration Generation**: `drizzle-kit generate`
- **Migration Execution**: `lib/db/migrate.ts`
