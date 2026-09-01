# DRAXELYRA Technical Documentation Coverage Matrix

**Audit Date**: 2026-09-02  
**Coverage Level**: 100% Repository Subsystem Verification  
**Methodology**: Direct code inspection across schemas, state machines, API endpoints, WebSocket gateway, AI providers, and PWA offline queue.

---

## Subsystem Coverage Audit

| Subsystem / Layer | Source Implementation Files | Verification Status | Documentation Reference | Technical Depth Delivered |
| :--- | :--- | :---: | :--- | :--- |
| **Database Schema** | lib/db/src/schema/index.ts | Verified | docs/database/schema.md | All 18 tables documented with types, nullability, default values, and relational constraints. |
| **OCC Concurrency** | rtifacts/api-server/src/services/ | Verified | docs/database/concurrency-occ.md | Compare-and-Swap version checking algorithm, 409 error envelope, client-side reload workflow. |
| **Case Lifecycle FSM**| rtifacts/api-server/src/services/case-state-machine.ts | Verified | docs/domain/case-lifecycle.md | 10-state transition matrix, role guards, mandatory review notes, rejection archive logic. |
| **Task FSM & SLA** | rtifacts/api-server/src/services/task-state-machine.ts | Verified | docs/domain/task-lifecycle.md | 7-state task machine, dynamic SLA tiers (4h, 8h, 16h, 36h) derived from priority score. |
| **Priority Engine** | rtifacts/api-server/src/lib/priority.ts | Verified | docs/domain/priority-engine.md | 5-factor weighted formula, exponential urgency decay, worked calculation example. |
| **Evidence Security**| rtifacts/api-server/src/middlewares/evidence.ts | Verified | docs/domain/evidence-audit.md | Magic-byte file header validation, SHA-256 integrity hash, path traversal defenses. |
| **MapLibre Engine** | src/components/Map.tsx | Verified | docs/geospatial/map-engine.md | WebGL layer hierarchy, color semantics, AOI polygon styling, Carto Voyager vector tiles. |
| **Offline Sync Queue**| src/lib/offline-sync.ts, src/lib/idb.ts | Verified | docs/offline/indexeddb-queue.md | Dexie/IDB client mutation storage, FIFO replay, network reconnect listener, OCC conflict resolution. |
| **Real-Time Gateway** | rtifacts/api-server/src/services/realtime-hub.ts | Verified | docs/realtime/realtime-architecture.md | WebSocket & SSE event bus, multi-tab BroadcastChannel deduplication, ping/pong heartbeat. |
| **Transactional Outbox**| rtifacts/api-server/src/services/outbox-worker.ts | Verified | docs/realtime/transactional-outbox.md | Postgres outbox_events polling, exponential retry backoff, dead-letter archiving. |
| **External Ingestion**| rtifacts/api-server/src/services/ingestion-engine.ts | Verified | docs/data-integrations/ | SACHET NDMA, USGS, GDACS, NASA FIRMS, Open-Meteo, Overpass, Copernicus STAC, WAQI. |
| **Multimodal AI Provider**| rtifacts/api-server/src/ai/GeminiMultimodalProvider.ts | Verified | docs/ai-ml/gemini-multimodal.md | Google Gemini 2.5 Flash via @google/genai, temperature 0.1, structured JSON schema output. |
| **Fallback Vision CV**| rtifacts/api-server/src/ai/MockVisionAssessmentProvider.ts | Verified | docs/ai-ml/mock-baseline.md | Offline heuristic damage scoring fallback, graceful degradation, SHA-256 caching. |
| **REST API Layer** | rtifacts/api-server/src/routes/ | Verified | docs/api/ | 8 endpoint group specifications with request/response schemas and HTTP error envelopes. |
| **RBAC Security Model**| rtifacts/api-server/src/middlewares/auth.ts | Verified | docs/authentication/auth-rbac.md | 6 emergency response roles, session cookie security flags, permission matrix per endpoint. |
| **Production Container**| Dockerfile, docker-compose.prod.yml | Verified | docs/deployment/deployment-guide.md | Multi-stage Docker build, unprivileged user, health check probes, reverse proxy configs. |