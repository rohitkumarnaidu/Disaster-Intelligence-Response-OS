# DRAXELYRA — FINAL API AUDIT
**Disaster Intelligence & Response OS**
*Certified: 2026-09-01 | Architecture: RESTful Micro-Routing with Strict RBAC & Lineage*

---

## 1. REST API Route Catalog & Authentication Matrix

All routes require active session authentication (`requireAuth`) and are subject to Role-Based Access Control (`requireRole`).

| HTTP Method | Route Endpoint | Purpose | Required Role | Return Format |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/healthz` | Kubernetes Liveness Probe | Public | `{ status: "ok" }` |
| `GET` | `/api/health/full` | Deep Health of DB + Providers | Operator / Admin | JSON Object |
| `GET` | `/api/incidents` | List all monitored incidents | All Authenticated | JSON Array |
| `POST` | `/api/incidents` | Declare new disaster incident | Disaster Officer / Admin | Incident Object |
| `GET` | `/api/incidents/:id/map` | Multi-Hazard GeoJSON Bundle | All Authenticated | FeatureCollections Bundle |
| `GET` | `/api/incidents/:id/weather` | Incident centroid weather | All Authenticated | Weather Telemetry Object |
| `GET` | `/api/cases` | Priority triage cases | All Authenticated | Cases Array |
| `GET` | `/api/cases/:id` | Case detail & breakdown | All Authenticated | Case Record |
| `GET` | `/api/cases/:id/lineage` | Full case data provenance DAG | All Authenticated | Complete Lineage Graph |
| `GET` | `/api/entities/:id/lineage` | Generic entity lineage probe | All Authenticated | Lineage Object |
| `POST` | `/api/cases/:id/review` | Human-in-the-loop review | Analyst / Commander / Admin | Updated Case |
| `POST` | `/api/cases/:id/task` | Generate response task | Manager / Commander / Admin | Task Record |
| `GET` | `/api/integrations/firms/area` | NASA FIRMS active hotspots | All Authenticated | Hotspot Features List |
| `GET` | `/api/integrations/sachet/alerts` | SACHET India CAP alerts | All Authenticated | CAP Alerts Array |
| `GET` | `/api/integrations/imd/weather` | IMD observation telemetry | All Authenticated | IMD Observation Object |
| `GET` | `/api/integrations/air-quality` | WAQI / Open-Meteo AQI | All Authenticated | AQI Telemetry Object |
| `GET` | `/api/integrations/health` | Probes all 9 external connectors| All Authenticated | ProviderHealth Array |
| `GET` | `/api/integrations/api-keys` | Masked runtime key inventory | Admin / Officer | Key Metadata Array |
| `POST` | `/api/integrations/api-keys` | Dynamic runtime key update | Admin / Commander | Status Response |
| `POST` | `/api/integrations/osm/sync` | Sync OSM Overpass critical assets| Officer / Admin | Synced Count & Details |
| `GET` | `/api/integrations/osm/status` | Cached OSM asset inventory | All Authenticated | Summary Object |
| `POST` | `/api/ai/damage-assessment` | Gemini Multimodal Inference | Analyst / Officer / Admin | DamageAssessmentOutput |

---

## 2. GeoJSON Normalization Standard (`/api/incidents/:id/map`)
The map aggregation endpoint normalizes all heterogeneous geospatial datasets into standard RFC 7946 GeoJSON `FeatureCollection` structures:
1. `aoi`: Area of Interest Polygon / MultiPolygon.
2. `cases`: Circle Point markers styled by priority score ($0–100$) and review status.
3. `criticalAssets`: Infrastructure nodes (Hospitals, Substations, Bridges, Schools).
4. `detections`: AI Vision & Remote Sensing bounding polygons / centroid points.
5. `fireDetections`: NASA FIRMS thermal anomaly hotspots with Fire Radiative Power (FRP) and satellite metadata.
6. `alerts`: SACHET / IMD warning boundary polygons with severity-coded color fills.
7. `fieldObservations`: Ground-truth mobile surveyor observations with verification status.
8. `imageryFootprints`: Copernicus Sentinel-1 SAR & Sentinel-2 Optical orbit footprints.

---

## 3. End-to-End Lineage Engine (`GET /api/entities/:id/lineage`)
Resolves an unbroken 10-link provenance graph for any incident, case, or triage decision:
```
Raw Remote Sensing Swath / CAP Alert / Sensor Reading
                   │
                   ▼
     Imagery Asset / Weather Alert Record
                   │
                   ▼
        AI / Processing Job Execution
                   │
                   ▼
    Multimodal Damage Detection (with Hash)
                   │
                   ▼
  Critical Infrastructure Spatial Intersect (OSM)
                   │
                   ▼
Deterministic Priority Calculation (Formula & Breakdown)
                   │
                   ▼
  Triage Case (Needs Review -> Confirmed)
                   │
                   ▼
      Human Reviewer Decision & Notes
                   │
                   ▼
       Operational Response Task
                   │
                   ▼
Audited Mitigation Outcome (Tamper-Evident SHA-256 Trail)
```
