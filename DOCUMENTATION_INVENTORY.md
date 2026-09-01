# DRAXELYRA Technical Documentation Inventory

**Audited & Built**: 2026-09-02  
**Static Site Build Status**: ✅ Compiled Cleanly with Zero Broken Links (docusaurus build pass)  
**Total Documentation Pages**: 82  
**Total Specification Tables**: 127  
**Total Mermaid Architecture / FSM / Sequence Diagrams**: 24  
**Primary Repository Ground Truth**: lib/db/src/schema/index.ts, artifacts/api-server/src/, src/

---

## Category Inventory Matrix

| # | Documentation Category | Directory | Page Count | Architecture / Diagrams | Key Source Files Covered |
| :- | :--- | :--- | :-: | :-: | :--- |
| **01** | **System Overview** | docs/01-overview/ | 4 | System Context, Ingestion Flow | package.json, README.md, Monorepo Architecture |
| **02** | **Getting Started** | docs/02-getting-started/ | 5 | Environment Setup, First Run | .env.example, docker-compose.yml, scripts/seed.ts |
| **03** | **System Architecture** | docs/03-architecture/ | 4 | Monorepo Flow, Request Sequence | pnpm-workspace.yaml, artifacts/api-server/src/index.ts |
| **04** | **Frontend Architecture** | docs/04-frontend/ | 7 | Component Tree, Query Cache Flow | src/App.tsx, src/pages/, src/hooks/use-query.ts |
| **05** | **Backend Architecture** | docs/05-backend/ | 5 | Middleware Stack, Job Pipeline | artifacts/api-server/src/index.ts, src/middlewares/ |
| **06** | **Database Schema & ORM** | docs/06-database/ | 4 | ER Diagram, OCC CAS Flow | lib/db/src/schema/index.ts, lib/db/src/index.ts |
| **07** | **Authentication & RBAC** | docs/07-authentication/ | 2 | RBAC Permissions Matrix | artifacts/api-server/src/middlewares/auth.ts |
| **08** | **Domain State Machines** | docs/08-domain/ | 4 | 10-State Case FSM, 7-State Task FSM | artifacts/api-server/src/services/case-state-machine.ts |
| **09** | **Geospatial & Map Engine** | docs/09-geospatial/ | 3 | WebGL Layering, GeoJSON Pipeline | src/components/Map.tsx, artifacts/api-server/src/utils/geo.ts |
| **10** | **Offline Architecture** | docs/10-offline/ | 3 | IndexedDB Sync Flow, Replay Queue | src/lib/offline-sync.ts, src/lib/idb.ts |
| **11** | **Real-Time Gateway** | docs/11-realtime/ | 4 | WS / SSE Multi-Tab Broadcast | artifacts/api-server/src/services/realtime-hub.ts |
| **12** | **External Integrations** | docs/12-data-integrations/ | 10 | Ingestion Pipeline Matrix | artifacts/api-server/src/services/ingestion-engine.ts |
| **13** | **AI / ML Intelligence** | docs/13-ai-ml/ | 7 | Gemini Multimodal Inference Flow | artifacts/api-server/src/ai/GeminiMultimodalProvider.ts |
| **14** | **REST API Reference** | docs/14-api/ | 8 | OpenAPI Endpoints & Envelopes | artifacts/api-server/src/routes/ |
| **15** | **Testing & Quality Gates** | docs/15-testing/ | 1 | CI/CD Automated Test Matrix | vitest.config.ts, playwright.config.ts |
| **16** | **Security & Hardening** | docs/16-security/ | 1 | Threat Model, Magic-Byte Guards | artifacts/api-server/src/middlewares/evidence.ts |
| **17** | **Production Deployment** | docs/17-deployment/ | 1 | Multi-Stage Docker & Health Probes | Dockerfile, docker-compose.prod.yml |
| **18** | **Operational Runbooks** | docs/18-maintenance/ | 2 | SOPs & Incident Troubleshooting | scripts/db-backup.sh, scripts/vacuum.sql |
| **19** | **Contributing Standards** | docs/19-contributing/ | 2 | Git Flow, ESLint, TypeScript Rules | eslint.config.js, tsconfig.json |
| **20** | **System Reference** | docs/20-reference/ | 2 | 50+ Term Glossary, Config Matrix | .env.example, artifacts/api-server/src/config.ts |
| **21** | **Strategic Roadmap** | docs/21-roadmap/ | 1 | Phase 1 to Phase 4 Evolution | Strategic Engineering Plan |