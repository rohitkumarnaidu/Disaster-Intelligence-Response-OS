---
id: services
title: Backend Domain Services
sidebar_label: Domain Services
sidebar_position: 2
---

# Backend Domain Services

<span className="badge-implemented">Implemented</span>

Domain services in `artifacts/api-server/src/services/` encapsulate core business logic, finite state transitions, and background ingestion tasks.

---

## Service Catalog

| Service Name | Source File | Core Responsibilities |
| :--- | :--- | :--- |
| **Case State Machine** | `case-state-machine.ts` | Manages `cases` lifecycle, validates allowed transitions, increments OCC versions, logs status history, and writes outbox events. |
| **Task State Machine** | `task-state-machine.ts` | Manages `tasks` lifecycle, computes dynamic priority SLAs, and records task audit trails. |
| **Ingestion Engine** | `ingestion-engine.ts` | Cron scheduler polling USGS Earthquakes, GDACS Multi-hazard, SACHET NDMA, and NASA FIRMS fire hotspots. |
| **Damage Assessment** | `damage-assessment.ts` | Orchestrates AI multimodal damage assessment, prompt construction, and Zod output schema validation. |
| **Asset Enrichment** | `asset-enrichment.ts` | Intersects incident AOIs with OpenStreetMap infrastructure to create operational cases. |
| **OSM Sync** | `osm-sync.ts` | Executes Overpass QL queries to extract hospitals, schools, bridges, and emergency shelters. |
| **Job Runner** | `job-runner.ts` | Asynchronous queue processing satellite discovery, downloads, and change-detection tasks. |
