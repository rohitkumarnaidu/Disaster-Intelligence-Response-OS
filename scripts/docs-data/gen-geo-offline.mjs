import fs from 'fs';
import path from 'path';

export function generateGeoOffline(DOCS_DIR) {
  const write = (relPath, content) => {
    const fullPath = path.join(DOCS_DIR, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  };

  // 09-geospatial/overview.md
  write('09-geospatial/overview.md', `# Geospatial Overview

<span className="badge-implemented">Implemented</span>

Geospatial data forms the operational canvas of DRAXELYRA. The platform integrates satellite observations, cadastral facility layers, and field tracks into unified interactive maps.

\`\`\`mermaid
flowchart TD
    A[Incident AOI Polygon] --> M[MapLibre GL Map Canvas]
    B[Critical Infrastructure Points] --> M
    C[AI Damage Detections] --> M
    D[Prioritized Operational Cases] --> M
    E[Field Responder GPS Observations] --> M
    M --> F[Duty Officer Triage Interface]
\`\`\`
`);

  // 09-geospatial/map-architecture.md
  write('09-geospatial/map-architecture.md', `# Map Architecture & Rendering Engine

<span className="badge-implemented">Implemented</span>

The map engine is built on **MapLibre GL** via \`react-map-gl/maplibre\`.

---

## Technical Stack

- **Renderer**: WebGL hardware-accelerated tile rendering.
- **Basemap Style**: Carto Voyager GL vector style (\`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json\`).
- **Endpoint**: \`GET /api/incidents/:id/map\` delivers GeoJSON FeatureCollections for all active incident layers.
`);

  // 09-geospatial/geojson.md
  write('09-geospatial/geojson.md', `# GeoJSON Schemas & Specifications

<span className="badge-implemented">Implemented</span>

The map API returns an aggregated JSON payload containing standard RFC 7946 GeoJSON collections:

\`\`\`json
{
  "aoi": {
    "type": "Polygon",
    "coordinates": [[[80.15, 13.0], [80.30, 13.0], [80.30, 13.15], [80.15, 13.15], [80.15, 13.0]]]
  },
  "cases": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [80.2707, 13.0827] },
        "properties": {
          "id": "C-1048",
          "status": "NEEDS_REVIEW",
          "priority": 83,
          "assetType": "Hospital"
        }
      }
    ]
  },
  "criticalAssets": { "type": "FeatureCollection", "features": [] },
  "detections": { "type": "FeatureCollection", "features": [] },
  "fieldObservations": { "type": "FeatureCollection", "features": [] }
}
\`\`\`
`);

  // 09-geospatial/layers.md
  write('09-geospatial/layers.md', `# Map Layer Hierarchy & Styling

<span className="badge-implemented">Implemented</span>

| Layer ID | Source | Geometry | Styling Rules |
| :--- | :--- | :--- | :--- |
| \`aoi-layer\` | \`aoi\` | Polygon | Fill: \`#259184\`, Opacity: \`0.10\` |
| \`aoi-layer-line\` | \`aoi\` | LineString | Stroke: \`#259184\`, Width: 2, Dasharray: \`[2, 2]\` |
| \`assets-layer\` | \`criticalAssets\` | Point | Circle radius: \`8px\`, Color: \`#4a5568\`, Stroke: \`#ffffff\` |
| \`detections-layer\` | \`detections\` | Point / Polygon | Circle radius: \`4px\`, Color: \`#cd372f\`, Opacity: \`0.6\` |
| \`cases-layer\` | \`cases\` | Point | Radius: \`6px\`, Color based on status: NEEDS_REVIEW (\`#EFAC30\`), CONFIRMED (\`#259184\`), REJECTED (\`#cd372f\`) |
| \`observations-layer\` | \`fieldObservations\` | Point | Radius: \`5px\`, Color: \`#259184\`, Stroke: \`#ffffff\` |
`);

  // 09-geospatial/coordinates.md
  write('09-geospatial/coordinates.md', `# Coordinate Reference Systems (CRS)

<span className="badge-implemented">Implemented</span>

- **Internal Storage & GeoJSON Standard**: **WGS 84 (EPSG:4326)** — standard longitude/latitude coordinates in decimal degrees.
- **Tile Rendering**: **Web Mercator (EPSG:3857)** — projected dynamically by MapLibre GL.
- **Format Order**: GeoJSON RFC 7946 strictly requires \`[longitude, latitude]\` coordinate ordering.
`);

  // 09-geospatial/spatial-data.md
  write('09-geospatial/spatial-data.md', `# Spatial Data Models & Queries

<span className="badge-implemented">Implemented</span>

Geometries are stored in PostgreSQL \`jsonb\` columns (\`aoi\`, \`location\`, \`geometry\`).

- **Spatial Joins**: Detections are matched to nearby critical infrastructure assets by checking coordinate proximity within the incident AOI bounding box.
`);

  // 09-geospatial/map-interactions.md
  write('09-geospatial/map-interactions.md', `# User Map Interactions

<span className="badge-implemented">Implemented</span>

1. **Interactive Layer Clicking**: Clicking on a case marker triggers client-side navigation to \`/cases/:id\`.
2. **Asset Information Popups**: Clicking an infrastructure marker shows facility name and asset type.
3. **Layer Visibility Toggles**: Toggling filters in the Assessment workspace enables/disables specific MapLibre layers.
`);

  // 09-geospatial/external-data.md
  write('09-geospatial/external-data.md', `# External GIS & Earth Observation Data

<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">OGC WMS/WFS Planned</span>

- **Current Implementation**: Simulated ArcGIS & Sentinel-2 layers in demo workspace.
- **Planned Capabilities**: Direct ingestion of OGC WMS/WMTS raster tiles, ESRI FeatureServer endpoints, and Copernicus Open Access Hub satellite streams.
`);

  // 10-offline/pwa.md
  write('10-offline/pwa.md', `# Progressive Web Application (PWA)

<span className="badge-implemented">Implemented</span>

DRAXELYRA is structured as an offline-capable Progressive Web Application to support tactical responders operating in communication-compromised disaster zones.
`);

  // 10-offline/offline-architecture.md
  write('10-offline/offline-architecture.md', `# Offline Architecture & Lifecycle

<span className="badge-implemented">Implemented</span>

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Responder as Field Responder
    participant Fetch as customFetch()
    participant Event as CustomEvent Bus
    participant IDB as IndexedDB (syncQueue)
    participant Sync as Sync Engine
    participant API as Express API Server

    Note over Responder,Fetch: Field responder loses cellular connectivity
    Responder->>Fetch: Submit Ground Observation / Status Update
    Fetch->>Fetch: Check navigator.onLine (false)
    Fetch->>Event: Dispatch offline-sync-enqueue
    Event->>IDB: queueRequest(url, method, body)
    IDB-->>Responder: Return queuedOffline: true
    
    Note over Responder,Sync: Connectivity restored
    Sync->>IDB: getQueue()
    IDB-->>Sync: Return buffered mutation list
    loop For each queued item
        Sync->>API: Execute HTTP Request
        API-->>Sync: 200 OK Response
        Sync->>IDB: clearQueueItem(id)
    end
\`\`\`
`);

  // 10-offline/indexeddb.md
  write('10-offline/indexeddb.md', `# IndexedDB Storage Implementation

<span className="badge-implemented">Implemented</span>

The offline storage engine is implemented in \`artifacts/draxelyra/src/lib/offline-sync.ts\`:

\`\`\`typescript
export async function getOfflineDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("draxelyra-offline", 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
\`\`\`
`);

  // 10-offline/sync-engine.md
  write('10-offline/sync-engine.md', `# Synchronization Engine

<span className="badge-implemented">Implemented</span>

- **Mutation Interception**: \`customFetch\` in \`lib/api-client-react/src/custom-fetch.ts\` intercepts network failures when \`!navigator.onLine\` for non-GET requests.
- **Queue Enqueueing**: Serializes URL, HTTP method, and JSON body into \`syncQueue\`.
- **Sequential Replay**: Replays queued mutations in strict chronological order upon network reconnection.
`);

  // 10-offline/conflict-resolution.md
  write('10-offline/conflict-resolution.md', `# Conflict Resolution & Version Checking

<span className="badge-implemented">Implemented</span>

When offline mutations are replayed against the API server:
1. Every mutation carries the entity's \`version\` at the time of offline editing.
2. The server compares the mutation version against the live PostgreSQL version.
3. If concurrent online edits occurred, the server returns \`409 Conflict\` with \`VERSION_CONFLICT\`, preserving data integrity and prompting the user for resolution.
`);

  // 10-offline/retry-strategy.md
  write('10-offline/retry-strategy.md', `# Retry Strategy & Exponential Backoff

<span className="badge-implemented">Implemented</span>

- **Immediate Reconnection**: Triggers on \`window.addEventListener('online')\`.
- **Transient Failures (5xx / Timeout)**: Retries with exponential backoff (1s, 2s, 4s, 8s intervals).
- **Permanent Client Errors (4xx)**: Logged and quarantined to prevent blocking subsequent queue items.
`);

  // 11-ai-ml/overview.md
  write('11-ai-ml/overview.md', `# AI / ML Intelligence Overview

<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">Live Service Planned</span>

DRAXELYRA integrates machine learning to accelerate initial disaster change-detection while ensuring human duty officers retain complete decision authority.
`);

  // 11-ai-ml/model-architecture.md
  write('11-ai-ml/model-architecture.md', `# Model Architecture & Pipelines

<span className="badge-mock">Mock Adapter Active</span>

- **Model Identifier**: \`change-detector/v2.4.1\`
- **Target Task**: Bi-temporal satellite change detection and damage categorization.
- **Output Schema**: Bounding geometry / point, damage classification (\`Severe\`, \`Moderate\`, \`Minor\`), statistical confidence score (0.0–1.0).
`);

  // 11-ai-ml/damage-assessment.md
  write('11-ai-ml/damage-assessment.md', `# Damage Assessment Taxonomy

<span className="badge-implemented">Implemented</span>

DRAXELYRA classifies structural damage into six standardized operational tiers:

| Damage Class | Score | Visual Indicators |
| :--- | :--- | :--- |
| **Destroyed** | 100 | Total structural collapse, foundation washed out |
| **Severe** | 75 | Major structural damage, partial roof collapse, deep standing water |
| **Moderate** | 45 | Partial wall/roof impact, debris obstruction |
| **Uncertain** | 35 | Heavy cloud shadow, low resolution, obstructed view |
| **Minor** | 20 | Superficial facade damage, localized surface flooding |
| **No damage** | 0 | Baseline intact |
`);

  // 11-ai-ml/model-providers.md
  write('11-ai-ml/model-providers.md', `# Model Providers & Ingestion Adapters

<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">Integrations Planned</span>

- **Simulated Provider**: Deterministic Chennai monsoon replay (\`DEMO REPLAY / HISTORICAL\`).
- **Target Provider Integrations**: Copernicus Sentinel-2 (ESA), PlanetScope / SkySat (Planet Labs), Maxar Open Data Program.
`);

  // 11-ai-ml/inference-flow.md
  write('11-ai-ml/inference-flow.md', `# Inference Flow & Triage Pipeline

<span className="badge-implemented">Implemented</span>

\`\`\`mermaid
flowchart LR
    A[Pre/Post GeoTIFFs] --> B[Inference Service]
    B --> C[Candidate Detections]
    C --> D[Critical Asset Spatial Join]
    D --> E[Priority Calculation]
    E --> F[Human Analyst Review]
\`\`\`
`);

  // 11-ai-ml/confidence.md
  write('11-ai-ml/confidence.md', `# Statistical Confidence vs Calibration

<span className="badge-implemented">Implemented</span>

- Model confidence reflects the raw detection probability (0.00–1.00).
- In DRAXELYRA, model confidence contributes **10%** of the final priority score, ensuring low-confidence detections on vital assets (e.g. 55% confidence on a hospital) are not silently ignored.
`);

  // 11-ai-ml/priority-vs-confidence.md
  write('11-ai-ml/priority-vs-confidence.md', `# Priority vs Confidence: The Operational Divergence

<span className="badge-implemented">Implemented</span>

| Scenario | Model Confidence | Asset Criticality | Calculated Priority | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Hospital Inundation (Hero Case)** | **55%** (Moderate) | Hospital (100) | **83** (Critical) | **Immediate Field Check** |
| **Commercial Roof Reflection** | **96%** (High) | Commercial (30) | **28** (Low) | **Deprioritized / Archived** |

:::important Key Takeaway
Confidence measures model certainty; Priority measures operational consequence.
:::
`);

  // 11-ai-ml/future-ml-integration.md
  write('11-ai-ml/future-ml-integration.md', `# Future ML Roadmap

<span className="badge-planned">Planned Future Architecture</span>

1. **gRPC Inference Microservice**: High-throughput containerized PyTorch service.
2. **Active Learning Feedback Loop**: Rejected and confirmed analyst labels exported to retrain local change-detector weights.
3. **Multi-Modal Drone Telemetry**: Integrating real-time video stream object detection from tactical UAVs.
`);
}
