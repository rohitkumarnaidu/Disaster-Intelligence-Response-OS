---
id: architecture
title: Backend Application Bootstrap & Lifecycle
sidebar_label: Backend Architecture
sidebar_position: 1
---

# Backend Application Bootstrap & Lifecycle

<span className="badge-implemented">Implemented</span>

The backend API server is located in `artifacts/api-server/`. It is built with Express 5, Node.js 20+, and PostgreSQL 15 via Drizzle ORM.

---

## Server Bootstrap Sequence

**Source File**: [`artifacts/api-server/src/index.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/index.ts)

1. **Load Environment**: Initializes `dotenv` reading `.env`.
2. **Instantiate HTTP Server**: Creates Node `http.createServer(app)`.
3. **Initialize WebSocket Gateway**: Attaches `realtimeGateway.initialize(server, sessionSecret)` to the HTTP server for `/ws` upgrade requests.
4. **Start Background Ingestion**: Calls `ingestionEngine.start()` to initiate background cron workers for USGS, GDACS, and SACHET alerts.
5. **Start Outbox Dispatcher**: Launches the transactional outbox polling worker.
6. **Listen on Port**: Binds to `process.env.PORT || 3000`.
