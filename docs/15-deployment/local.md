# Local Deployment Guide

<span className="badge-implemented">Implemented</span>

Local deployment runs PostgreSQL via Docker Compose, Express backend on port 5000, and Vite frontend on port 5173.

```bash
# 1. Start database
docker compose up -d

# 2. Push schema
pnpm --filter @workspace/db run push

# 3. Start development servers
pnpm run dev
```
