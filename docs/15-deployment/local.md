# Local Deployment Guide

<span className="badge-implemented">Implemented</span>

To deploy DRAXELYRA on a local developer workstation or on-premises disaster operations server:

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Push Schema
pnpm --filter @workspace/db run push

# 3. Build & Run Production Bundle
pnpm run build
pnpm start
```
