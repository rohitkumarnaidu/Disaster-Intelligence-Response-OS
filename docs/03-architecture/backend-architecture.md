# Backend Architecture

<span className="badge-implemented">Implemented</span>

The backend service located at `artifacts/api-server` is an **Express 5** application in TypeScript compiled with **esbuild**.

---

## Source Directory Layout

```
artifacts/api-server/src/
├── app.ts                          # Express application configuration & middlewares
├── index.ts                        # Server entry point (starts HTTP on port 5000)
├── lib/
│   ├── logger.ts                   # Pino structured JSON logger
│   ├── priority.ts                 # Priority calculation mathematical model
│   └── priority.test.ts            # Unit tests for canonical priority score
├── middlewares/
│   └── auth.ts                     # requireAuth & requireRole RBAC guards
├── routes/
│   ├── index.ts                    # Root API router (/api)
│   ├── health.ts                   # Healthcheck endpoint (/api/health)
│   ├── auth.ts                     # Login, logout, session user (/api/auth)
│   ├── incidents.ts                # Incidents CRUD & Map GeoJSON (/api/incidents)
│   ├── cases.ts                    # Case triage, reviews & audit (/api/cases)
│   ├── tasks.ts                    # Response tasks & SLA tracking (/api/tasks)
│   ├── evidence.ts                 # File uploads & magic-byte check (/api/evidence)
│   ├── analytics.ts                # Operational metrics & funnel (/api/analytics)
│   ├── demo.ts                     # Scenario replay endpoints (/api/demo)
│   └── demo-data.ts                # Seed dataset for Chennai Urban Flood
└── services/
    ├── case-state-machine.ts       # Case lifecycle transitions & OCC versioning
    └── task-state-machine.ts       # Task lifecycle transitions & OCC versioning
```
