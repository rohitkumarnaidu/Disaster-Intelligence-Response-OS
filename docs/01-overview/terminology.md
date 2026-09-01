# Terminology & Acronyms

| Term / Acronym | Definition | Context in DRAXELYRA |
| :--- | :--- | :--- |
| **AOI** | Area of Interest | GeoJSON polygon outlining the geographical boundary of a disaster incident. |
| **EO** | Earth Observation | Satellite, drone, and aerial sensor data used for damage detection. |
| **OCC** | Optimistic Concurrency Control | Version-check pattern preventing simultaneous conflicting edits by multiple analysts. |
| **CAS** | Compare-And-Swap | Atomic SQL update technique (`WHERE id = ? AND version = ?`) enforcing OCC. |
| **RBAC** | Role-Based Access Control | Authorization system controlling endpoint access based on assigned organizational roles. |
| **SLA** | Service Level Agreement | Target time window within which a high-priority task must be accepted and acted on. |
| **Magic Bytes** | File Header Signatures | Leading bytes of binary files (e.g., `FF D8 FF` for JPEG) inspected to prevent extension spoofing. |
| **PWA** | Progressive Web Application | Architecture allowing the web console to run offline on mobile devices. |
| **IndexedDB** | In-Browser NoSQL Database | Local storage engine used to buffer offline mutations before synchronization. |
| **Drizzle ORM** | TypeScript SQL ORM | Database toolkit defining PostgreSQL schemas and type-safe relational queries. |
| **Orval** | OpenAPI Codegen Engine | Generates React Query hooks and TypeScript client bindings from `openapi.yaml`. |
| **Pino** | Structured JSON Logger | High-performance logging framework used across API server routes. |
| **Hero Case** | Canonical Demo Case (`C-1048`) | Seeded case (Hospital structure damage in Chennai) used to demonstrate deterministic triage. |
