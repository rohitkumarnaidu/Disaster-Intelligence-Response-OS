---
id: development-setup
title: Local Development Setup & Workflows
sidebar_label: Development Setup
sidebar_position: 1
---

# Local Development Setup & Workflows

<span className="badge-implemented">Implemented</span>

---

## Prerequisites
- **Node.js**: `>= 20.10.0`
- **pnpm**: `>= 10.0.0`
- **Docker**: For running PostgreSQL 15 datastore.
- **Git**: For version control.

---

## Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS.git
cd Disaster-Intelligence-Response-OS

# 2. Install workspace dependencies
pnpm install

# 3. Start local PostgreSQL 15 database
docker compose -f docker-compose.yml up -d postgres

# 4. Configure environment variables
cp .env.example .env

# 5. Push schema migrations to PostgreSQL
pnpm --filter @workspace/db run db:push

# 6. Start development servers with HMR
pnpm run dev
```

The command center will be available at `http://localhost:5173` and the backend API at `http://localhost:3000`.
