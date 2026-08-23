import fs from 'node:fs';
import path from 'node:path';

export function generateGeoOffline(docsDir) {
  const write = (relPath, content) => {
    const fullPath = path.join(docsDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf-8');
  };

  write('09-geospatial/map-engine.md', `
# Map Engine Implementation
<span className="badge-implemented">Implemented</span>

The DRAXELYRA platform incorporates a high-performance, WebGL-accelerated map engine based on \`react-map-gl\`, \`maplibre\`, and \`maplibre-gl\`. It serves as the primary visual interface for command center operators and field responders.

## Architecture

The map engine is built using an open-source geospatial stack, utilizing OpenStreetMap raster tiles for basemaps and GeoJSON for dynamic feature overlays.

\`\`\`mermaid
graph TD
    DB[(PostgreSQL/PostGIS)] --> API[API Layer]
    API --> |toGeoJsonGeometry| DTO[GeoJSON DTO]
    DTO --> React[React Query Cache]
    React --> |useIncidentMap| Map[IncidentMap.tsx]
    Map --> |MapLibre GL JS| Canvas[WebGL Canvas]
    
    style DB fill:#1e40af,stroke:#93c5fd,color:#fff
    style API fill:#166534,stroke:#86efac,color:#fff
    style Map fill:#b91c1c,stroke:#fca5a5,color:#fff
\`\`\`

## Backend Data Transformation

All coordinates are stored in the database in WGS84 (EPSG:4326). When fetching the incident map endpoint (\`/api/incidents/:id/map\`), the backend aggregates multiple entity types into a unified response of \`FeatureCollection\` objects.

**Source File:** \`backend/src/utils/geo.ts\`
\`\`\`typescript
export function toGeoJsonGeometry(loc: { lat: number; lng: number }): GeoJSON.Point {
  return {
    type: 'Point',
    coordinates: [loc.lng, loc.lat] // GeoJSON strictly requires [longitude, latitude]
  };
}
\`\`\`

## React Map Component

**Source File:** \`apps/web/src/components/IncidentMap.tsx\`

The map leverages \`react-map-gl/maplibre\` to render layers interactively. Basemap tiles are fetched from OSM:
\`https://tile.openstreetmap.org/{z}/{x}/{y}.png\`

### Layer Definitions

The map renders 6 distinct GeoJSON layers to represent the operational theater:

| Layer Name | Visual Treatment | Description |
|---|---|---|
| **AOI (Area of Interest)** | Fill: \`#259184\` (0.1 opacity) + Dashed Border | Represents the bounding geometry of the disaster. |
| **Critical Assets** | Circle: Radius 8, \`#4a5568\`, White Stroke | High-value targets (hospitals, shelters, bridges). |
| **Detections** | Circle: Radius 4, \`#cd372f\` (0.6 opacity) | Raw AI detections before analyst verification. |
| **Cases (Needs Review)** | Circle: Radius 6, \`#EFAC30\` | Unverified cases awaiting analyst triage. |
| **Cases (Confirmed)** | Circle: Radius 6, \`#259184\` | Actionable, verified impact zones. |
| **Cases (Rejected/Closed)** | Circle: Radius 6, \`#cd372f\` / \`#8b9b95\` | Dismissed or resolved incidents. |
| **Field Observations** | Circle: Radius 5, \`#259184\`, White Stroke | Reports directly uploaded by responders. |

### API Response Schema

The \`['incident-map', incidentId]\` query fetches data matching the following schema:

\`\`\`json
{
  "aoi": {
    "type": "Feature",
    "geometry": { "type": "Polygon", "coordinates": [...] },
    "properties": { "name": "Chennai Basin" }
  },
  "cases": { "type": "FeatureCollection", "features": [...] },
  "criticalAssets": { "type": "FeatureCollection", "features": [...] },
  "detections": { "type": "FeatureCollection", "features": [...] },
  "fieldObservations": { "type": "FeatureCollection", "features": [...] }
}
\`\`\`

### Interactive Features

- **Click Handlers:** Clicking a case feature automatically transitions the user to \`/cases/\${id}\`. Clicking a critical asset triggers a popup alerting the user of the asset's name and type.
- **Layout Modes:** The component supports a \`compact\` mode (190px height) for sidebars and dashboards, and a \`full\` mode (440px height) for dedicated map views.
- **CRS Projection:** While data is transferred in EPSG:4326, the WebGL canvas dynamically projects coordinates to Web Mercator (EPSG:3857) for rendering.
  `);

  write('09-geospatial/offline-sync.md', `
# Offline Synchronization
<span className="badge-implemented">Implemented</span>

To guarantee continuity of operations in degraded or entirely disconnected environments, DRAXELYRA implements a robust Service Worker and IndexedDB-based queueing mechanism.

## Architecture

\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant customFetch
    participant IndexedDB
    participant ServiceWorker
    participant Network
    
    User->>App: Submits field report
    App->>customFetch: POST /api/tasks/:id
    alt is Online
        customFetch->>Network: Forward Request
        Network-->>customFetch: 200 OK
        customFetch-->>App: Success
    else is Offline
        customFetch->>IndexedDB: queueRequest(url, method, body)
        IndexedDB-->>customFetch: Queued (ID: 1)
        customFetch-->>App: Simulated Success
    end
\`\`\`

## Service Worker Implementation

**Source File:** \`apps/web/public/sw.js\`

The Service Worker handles asset caching and network intercepting.
- **Cache Name:** \`draxelyra-v1\`
- **Install Phase:** Caches the root \`/\` and static assets. Calls \`skipWaiting()\` to immediately activate.
- **Fetch Logic:** Bypasses \`/api/\` requests (handled by customFetch) and non-GET requests. For all other GET requests, it uses a cache-first, network-fallback strategy.

## IndexedDB Queue

**Source File:** \`apps/web/src/lib/offline-sync.ts\`

The platform utilizes IndexedDB to persist mutations when offline.

- **Database:** \`draxelyra-offline\` (Version 1)
- **Store:** \`syncQueue\` (keyPath: \`id\`, \`autoIncrement: true\`)

Core functions exported for queue management:
\`\`\`typescript
export async function getOfflineDB(): Promise<IDBPDatabase> { ... }
export async function queueRequest(url: string, method: string, body: any): Promise<number> { ... }
export async function getQueue(): Promise<QueueItem[]> { ... }
export async function clearQueueItem(id: number): Promise<void> { ... }
\`\`\`

## Network Interceptor

**Source File:** \`lib/api-client-react/src/custom-fetch.ts\`

The custom fetch wrapper acts as the application's circuit breaker. If \`!navigator.onLine\` evaluates to true, any non-GET request is automatically serialized and passed to \`queueRequest\`. The UI is immediately updated optimistically.

## Conflict Resolution & Status

The \`/field\` page provides a dedicated offline status widget. It queries \`getQueue()\` to display the pending operations count. 
If an optimistic update causes a conflict upon syncing (e.g., a \`409 VERSION_CONFLICT\` from the backend), the application pauses the queue and prompts the user for conflict resolution, displaying the server's current state alongside the local queued state.
  `);

  write('10-ai-ml/intelligence-pipeline.md', `
# AI/ML Intelligence Pipeline
<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">Planned</span>

The AI/ML Intelligence pipeline provides rapid analysis of bi-temporal satellite imagery to generate actionable damage assessments.

> [!IMPORTANT]
> The current system utilizes a mock adapter simulating the planned \`change-detector/v2.4.1\` model. The outputs are deterministic for the Chennai Urban Flood demo scenario but structurally match the planned production payload.

## Pipeline Architecture

\`\`\`mermaid
graph LR
    Pre[Pre-Disaster Imagery] --> Model
    Post[Post-Disaster Imagery] --> Model
    Model[Change Detector v2.4.1] --> Extract[Feature Extraction]
    Extract --> Taxonomy[Taxonomy Classification]
    Taxonomy --> Score[Priority Scoring]
    Score --> DB[(Database)]
\`\`\`

## Damage Taxonomy

The model classifies damage into specific, actionable tiers. Each tier carries a baseline score used in downstream priority calculations.

| Class | Baseline Score | Definition |
|---|---|---|
| **Destroyed** | 100 | Complete structural failure, unrecoverable. |
| **Severe** | 75 | Major structural damage, uninhabitable. |
| **Moderate** | 45 | Significant damage, requires extensive repair. |
| **Uncertain** | 35 | Anomalies detected but occluded (e.g., cloud cover/shadows). |
| **Minor** | 20 | Superficial damage, structure intact. |
| **No damage** | 0 | Baseline state maintained. |

## Confidence vs Priority Divergence

The model outputs a \`confidence\` score (0.0 to 1.0) indicating the statistical certainty of the prediction.

The Intelligence Pipeline intentionally separates AI *confidence* from Operational *priority*.
For example, a detection on a **Hospital** with a mere **55% confidence** may result in a **Priority 83** task, because the potential operational cost of missing hospital damage is catastrophic. Conversely, a **Commercial** building with **96% confidence** may only trigger a **Priority 28** task.

## Demo Scenario: Chennai Urban Flood

The deterministic mock adapter replays a carefully curated dataset representing the Chennai Urban Floods. It seeds:
- 120+ raw detections
- 15 Critical Assets
- 1 "Hero" Case (C-1048) demonstrating complex multi-asset occlusion.

## Future Roadmap

1. **gRPC Inference Service:** Transitioning from REST to a high-throughput gRPC stream for sub-second tile processing.
2. **Active Learning Loop:** Integrating analyst feedback (Confirmed/Rejected/Uncertain) directly into periodic LoRA fine-tuning runs.
3. **Drone Telemetry Integration:** Extending bi-temporal satellite ingestion to accept oblique drone footage for localized verification.
  `);
}
