---
id: deployment-guide
title: Production Deployment & Container Orchestration
sidebar_label: Deployment Guide
sidebar_position: 1
---

# Production Deployment & Container Orchestration

<span className="badge-implemented">Implemented</span>

DRAXELYRA is packaged as a multi-container Docker Compose deployment designed for cloud VMs or on-premise emergency operations center servers.

---

## Multi-Container Docker Topology

```mermaid
flowchart TD
    subgraph Host["Production Server / EOC Host"]
        NGINX["Nginx Reverse Proxy (:80 / :443 SSL)"]
        WEB["Frontend Static Container (Vite Nginx)"]
        API["Backend API Container (Node.js Express :3000)"]
        DB[("PostgreSQL 15 Container (:5432)")]
        VOL[("Persistent Docker Volume (/uploads)")]
    end

    CLIENT["Internet / EOC Intranet"] --> NGINX
    NGINX -->|/| WEB
    NGINX -->|/api & /ws| API
    API --> DB
    API --> VOL
```

---

## Environment Configuration (`.env.production`)

```bash
# Server Port & Mode
PORT=3000
NODE_ENV=production

# Database Connection URL
DATABASE_URL=postgresql://postgres:your_db_password_here@postgres:5432/draxelyra

# Session Security Secret (Generate with openssl rand -base64 32)
SESSION_SECRET=your_secure_random_session_secret_min_32_chars

# Multimodal AI Credentials (Optional: Falls back to baseline engine if omitted)
GEMINI_API_KEY=your_gemini_api_key_here

# Persistent Evidence Storage Directory
UPLOAD_DIR=/uploads
```

---

## Launch Sequence

```bash
# 1. Build multi-stage Docker images
docker compose -f docker-compose.yml build

# 2. Start PostgreSQL, API Server, and Web client containers in background
docker compose -f docker-compose.yml up -d

# 3. Apply Drizzle database migrations
docker compose exec api-server pnpm --filter @workspace/db run db:push

# 4. Confirm system health
curl http://localhost:3000/api/health
```
