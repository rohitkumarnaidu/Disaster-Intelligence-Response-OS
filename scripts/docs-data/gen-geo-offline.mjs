import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(dir, relPath, content) {
  const fullPath = path.join(dir, relPath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

export function generateGeoOffline(docsDir) {
  console.log('Generating 09-geospatial, 10-offline, 11-realtime, 12-data-integrations, and 13-ai-ml...');

  // ===========================================================================
  // 09-geospatial
  // ===========================================================================

  // 09-geospatial/01-map-engine.md
  writeFile(docsDir, '09-geospatial/01-map-engine.md', `---
id: map-engine
title: WebGL Map Engine & Multi-Layer Rendering
sidebar_label: Map Engine
sidebar_position: 1
---

# WebGL Map Engine & Multi-Layer Rendering

<span className="badge-implemented">Implemented</span>

The primary geospatial interface in DRAXELYRA is powered by **MapLibre GL JS** encapsulated via \`react-map-gl/maplibre\` in \`artifacts/draxelyra/src/components/map/IncidentMap.tsx\`.

\`\`\`mermaid
flowchart TD
    subgraph GeoData["Geospatial Data Feeds"]
        AOI[AOI GeoJSON Polygon]
        ASSETS[OSM Critical Infrastructure Points]
        DET[AI Anomaly Polygons & Heatmap]
        FIRMS[NASA FIRMS Thermal Hotspots]
        FIELD[Field Responder GPS Observations]
    end

    subgraph MapEngine["IncidentMap.tsx (MapLibre GL Canvas)"]
        STYLE["Carto Dark Matter / Esri World Imagery"]
        L1["Layer: aoi-polygon-fill"]
        L2["Layer: aoi-polygon-outline"]
        L3["Layer: detections-heatmap"]
        L4["Layer: critical-assets-symbols"]
        L5["Layer: case-status-markers"]
        L6["Layer: field-observations-pulse"]
    end


    AOI --> L1 & L2
    DET --> L3 & L5
    ASSETS --> L4
    FIRMS --> L3
    FIELD --> L6
    STYLE --> MapEngine
\`\`\`

---

## Layer Configuration & Color Semantics

| Layer Identifier | Geometry Type | Data Source | Styling Rules & Tactical Semantics |
| :--- | :--- | :--- | :--- |
| \`aoi-fill\` | \`Polygon\` | \`incident.aoi\` | Fill \`#259184\`, Opacity \`0.08\`. Delineates operational response theater. |
| \`aoi-outline\` | \`LineString\` | \`incident.aoi\` | Color \`#259184\`, Width \`2px\`, DashArray \`[2, 2]\`. |
| \`detections-heat\`| \`Point\` | \`detections\` | Kernel density weighting based on model confidence score (0.0 to 1.0). |
| \`critical-assets\`| \`Point\` | \`critical_assets\` | Red circle for Hospitals (\`#E53E3E\`), Blue for Substations (\`#3182CE\`), Orange for Bridges (\`#DD6B20\`). |
| \`cases-status\` | \`Point\` | \`cases\` | Yellow for \`NEEDS_REVIEW\`, Teal for \`CONFIRMED\`, Crimson for \`REJECTED\`, Grey for \`CLOSED\`. |
| \`field-obs\` | \`Point\` | \`field_observations\`| Green pulsing beacon for verified ground truth reports with attached photos. |
`);

  // 09-geospatial/02-geojson-pipelines.md
  writeFile(docsDir, '09-geospatial/02-geojson-pipelines.md', `---
id: geojson-pipelines
title: GeoJSON Ingestion, Clipping & Indexing
sidebar_label: GeoJSON Pipelines
sidebar_position: 2
---

# GeoJSON Ingestion, Clipping & Indexing

<span className="badge-implemented">Implemented</span>

All geospatial geometries ingested from external satellite passes, emergency feeds, or field devices are normalized to standard **WGS84 (EPSG:4326)** GeoJSON structures.

---

## Backend Spatial Utilities

**Source File**: [\`artifacts/api-server/src/utils/geo.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/utils/geo.ts)

\`\`\`typescript
export function toGeoJsonPoint(lat: number, lng: number): GeoJSON.Point {
  return {
    type: 'Point',
    // Strictly formatted as [Longitude, Latitude] conforming to RFC 7946
    coordinates: [Number(lng), Number(lat)],
  };
}

export function computeBoundingBox(polygon: GeoJSON.Polygon): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of polygon.coordinates[0]) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}
\`\`\`

---

## Spatial Query Performance
- Bounding box calculations run in O(N) time complexity where N is the vertex count of the AOI perimeter.
- PostgreSQL GIN indexes on \`jsonb\` columns support containment searches:


  \`\`\`sql
  SELECT * FROM cases WHERE aoi @> '{"coordinates": [92.79, 24.83]}';
  \`\`\`
`);

  // 09-geospatial/03-critical-infrastructure.md
  writeFile(docsDir, '09-geospatial/03-critical-infrastructure.md', `---
id: critical-infrastructure
title: OpenStreetMap Critical Infrastructure Extraction
sidebar_label: Critical Infrastructure
sidebar_position: 3
---

# OpenStreetMap Critical Infrastructure Extraction

<span className="badge-implemented">Implemented</span>

When an incident is declared, the **Asset Enrichment Service** (\`artifacts/api-server/src/services/osm-sync.ts\`) interrogates the **OpenStreetMap Overpass API** to extract all life-critical facilities within the active theater.

---

## Overpass QL Query Architecture

\`\`\`overpassql
[out:json][timeout:25];
(
  node["amenity"="hospital"](24.70,92.65,25.00,93.00);
  way["amenity"="hospital"](24.70,92.65,25.00,93.00);
  node["amenity"="clinic"](24.70,92.65,25.00,93.00);
  node["power"="substation"](24.70,92.65,25.00,93.00);
  node["man_made"="water_works"](24.70,92.65,25.00,93.00);
  way["highway"="bridge"](24.70,92.65,25.00,93.00);
  node["amenity"="school"](24.70,92.65,25.00,93.00);
);
out center body;
>;
out skel qt;
\`\`\`

---

## Ingested Infrastructure Classifications

| OSM Tag Pattern | Internal Asset Type | Criticality Weight (C) | Tactical Priority |

| :--- | :--- | :--- | :--- |
| \`amenity=hospital\`, \`amenity=clinic\` | \`HOSPITAL\` | **100** | Life-safety, mass casualty receiving, surgical power. |
| \`highway=bridge\` | \`BRIDGE\` | **85** | Evacuation bottlenecks, logistics supply corridor. |
| \`power=substation\` | \`POWER_SUBSTATION\` | **75** | Grid stability, communication tower power. |
| \`man_made=water_works\` | \`WATER_TREATMENT\` | **75** | Potable drinking water, waterborne pathogen prevention. |
| \`amenity=school\` | \`COMMUNITY_SHELTER\` | **70** | Displaced population staging, emergency relief distribution. |
`);

  // ===========================================================================
  // 10-offline
  // ===========================================================================

  // 10-offline/01-offline-architecture.md
  writeFile(docsDir, '10-offline/01-offline-architecture.md', `---
id: offline-architecture
title: Offline-First Field Architecture
sidebar_label: Offline Architecture
sidebar_position: 1
---

# Offline-First Field Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA treats catastrophic network outages as a standard operational environment. The mobile Progressive Web App (PWA) operates continuously in air-gapped disaster sectors.

\`\`\`mermaid
flowchart TD
    subgraph Client["Field Device Browser / PWA"]
        UI["Field Observation Form"]
        IDB[("IndexedDB (draxelyra-offline / syncQueue)")]
        SW["Service Worker (/sw.js)"]
        STATUS["Network Monitor navigator.onLine"]
    end

    subgraph Transport["Network Layer"]
        CONN{"Connection Status?"}
    end

    subgraph Backend["API Server Gateway"]
        API["POST /api/field/observations"]
        OCC["OCC Concurrency Checker"]
        DB[("PostgreSQL")]
    end

    UI --> IDB
    STATUS --> CONN
    CONN -->|Offline| IDB
    CONN -->|Online Reconnection| FLUSH["syncAllPending Replay Worker"]
    FLUSH --> IDB
    FLUSH --> API --> OCC --> DB

\`\`\`

---

## Offline Subsystem Pillars

1. **Static App Shell Caching (\`/sw.js\`)**: Service Worker caches all JavaScript, CSS, HTML, and icon assets on first load, enabling cold-boot without internet.
2. **IndexedDB Local Storage (\`draxelyra-offline\`)**: Unsynchronized mutations are serialized into IndexedDB.
3. **Automated Replay Engine (\`syncAllPending\`)**: Replays queued requests sequentially in FIFO order when connectivity returns.
`);

  // 10-offline/02-indexeddb-queue.md
  writeFile(docsDir, '10-offline/02-indexeddb-queue.md', `---
id: indexeddb-queue
title: IndexedDB Request Queue & Mutation Buffering
sidebar_label: IndexedDB Queue
sidebar_position: 2
---

# IndexedDB Request Queue & Mutation Buffering

<span className="badge-implemented">Implemented</span>

The client-side offline storage engine is located in \`artifacts/draxelyra/src/lib/offline-sync.ts\`.

---

## IndexedDB Schema

- **Database Name**: \`draxelyra-offline\` (Version 1)
- **Object Store**: \`syncQueue\`
- **Key Path**: \`id\` (Auto-incrementing integer)

\`\`\`typescript
export interface QueuedRequest {
  id?: number;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body: any;
  timestamp: string;
  expectedVersion?: number;
}
\`\`\`

---

## Core Queue Operations

\`\`\`typescript
export async function queueRequest(url: string, method: string, body: any, expectedVersion?: number): Promise<number> {
  const db = await openOfflineDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  
  const id = await store.add({
    url,
    method,
    body,
    timestamp: new Date().toISOString(),
    expectedVersion,
  });
  
  return id as number;
}
\`\`\`
`);

  // 10-offline/03-sync-replay-occ.md
  writeFile(docsDir, '10-offline/03-sync-replay-occ.md', `---
id: sync-replay-occ
title: FIFO Sync Replay & OCC Conflict Resolution
sidebar_label: Sync Replay & OCC
sidebar_position: 3
---

# FIFO Sync Replay & OCC Conflict Resolution

<span className="badge-implemented">Implemented</span>

When a field responder's device regains connectivity, the replay engine processes buffered requests in strict FIFO sequence.

---

## Replay Execution Loop

\`\`\`typescript
export async function syncAllPending(): Promise<{ synced: number; conflicts: number }> {
  const queue = await getQueue();
  let synced = 0;
  let conflicts = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        await clearQueueItem(item.id!);
        synced++;
      } else if (response.status === 409) {
        // Concurrency conflict occurred on server while device was offline
        conflicts++;
        await handleSyncConflict(item, await response.json());
      }
    } catch (err) {
      console.warn('Network interrupted during replay, pausing queue.', err);
      break;
    }
  }

  return { synced, conflicts };
}
\`\`\`
`);

  // ===========================================================================
  // 11-realtime
  // ===========================================================================

  // 11-realtime/01-realtime-architecture.md
  writeFile(docsDir, '11-realtime/01-realtime-architecture.md', `---
id: realtime-architecture
title: Real-Time Messaging Architecture & Channels
sidebar_label: Realtime Architecture
sidebar_position: 1
---

# Real-Time Messaging Architecture & Channels

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a hybrid real-time communication fabric combining **WebSockets (\`/ws\`)**, **Server-Sent Events (\`/api/events\`)**, and the browser **\`BroadcastChannel\` API**.

\`\`\`mermaid
flowchart TD
    subgraph Clients["EOC Operator Clients"]
        T1[Browser Tab 1]
        T2[Browser Tab 2]
        BC[BroadcastChannel: draxelyra_realtime_sync]
    end

    subgraph RealtimeServer["Express & WebSocket Gateway"]
        WS_GW["WebSocketServer (/ws)"]
        SSE_GW["SSE Controller (/api/events)"]
        REGISTRY["Client Subscription Registry"]
    end

    subgraph Data["Outbox Poller"]
        OUTBOX["outbox_events Table"]
        POLLER["Transactional Outbox Worker"]
    end

    T1 <-->|WebSocket Connection| WS_GW
    T2 <-->|WebSocket Connection| WS_GW
    T1 <-->|Local Tab Sync| BC <--> T2

    OUTBOX --> POLLER --> WS_GW & SSE_GW
    WS_GW --> REGISTRY
\`\`\`

---

## Protocol Comparison

| Capability | WebSocket (\`/ws\`) | Server-Sent Events (\`/api/events\`) | BroadcastChannel API |
| :--- | :--- | :--- | :--- |
| **Direction** | Bidirectional (Duplex) | Unidirectional (Server -> Client) | Client-side Cross-Tab Sync |

| **Authentication** | Session cookie on WS handshake | Session cookie on HTTP stream | Same-origin browser memory |
| **Heartbeat** | 25-second Ping/Pong | 15-second SSE comment \`:keepalive\` | None (Local process) |
| **Primary Use** | Real-time case updates & alerts | Firewall-restricted fallback | Prevents redundant WS connections |
`);

  // 11-realtime/02-transactional-outbox.md
  writeFile(docsDir, '11-realtime/02-transactional-outbox.md', `---
id: transactional-outbox
title: Transactional Outbox Pattern & Zero Event Loss
sidebar_label: Transactional Outbox
sidebar_position: 2
---

# Transactional Outbox Pattern & Zero Event Loss

<span className="badge-implemented">Implemented</span>

To guarantee that domain events are never lost if the server restarts or network partitions occur during an API call, DRAXELYRA utilizes the **Transactional Outbox Pattern** in \`artifacts/api-server/src/realtime/outbox.ts\`.

\`\`\`mermaid
sequenceDiagram
    participant API as Route Handler
    participant DB as PostgreSQL (Single ACID Transaction)
    participant Outbox as outbox_events Table
    participant Dispatcher as Outbox Dispatcher Worker
    participant WS as WebSocket Gateway

    API->>DB: BEGIN Transaction
    API->>DB: UPDATE cases SET status="CONFIRMED", version=3
    API->>Outbox: INSERT INTO outbox_events (status="PENDING", eventType="CASE_CONFIRMED")
    DB-->>API: COMMIT Transaction

    loop Polling Interval (Every 500ms)
        Dispatcher->>Outbox: SELECT * FROM outbox_events WHERE status='PENDING' LIMIT 50 FOR UPDATE SKIP LOCKED
        Outbox-->>Dispatcher: Batch of Pending Events
        Dispatcher->>WS: Broadcast to Subscribed Channels
        Dispatcher->>Outbox: UPDATE outbox_events SET status='DISPATCHED', dispatched_at=NOW()
    end
\`\`\`
`);

  // 11-realtime/03-event-contracts.md
  writeFile(docsDir, '11-realtime/03-event-contracts.md', `---
id: event-contracts
title: Domain Event Types & Schema Contracts
sidebar_label: Event Contracts
sidebar_position: 3
---

# Domain Event Types & Schema Contracts

<span className="badge-implemented">Implemented</span>

**Source File**: [\`artifacts/api-server/src/realtime/contracts.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/realtime/contracts.ts)

Every real-time event conforms to a strictly typed envelope:

\`\`\`typescript
export type RealtimeEventType =
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'CASE_CREATED'
  | 'CASE_CONFIRMED'
  | 'CASE_REJECTED'
  | 'CASE_TASKED'
  | 'TASK_ASSIGNED'
  | 'TASK_VERIFIED'
  | 'TASK_COMPLETED'
  | 'WEATHER_ALERT_RECEIVED'
  | 'FIRE_DETECTION_RECEIVED'
  | 'AUDIT_EVENT_CREATED';

export interface DomainEventEnvelope<T = any> {
  id: string;
  eventType: RealtimeEventType;
  entityType: 'INCIDENT' | 'CASE' | 'TASK' | 'WEATHER' | 'FIRE' | 'AUDIT';
  entityId: string;
  version: number;
  incidentId?: string;
  timestamp: string;
  payload: T;
}
\`\`\`
`);

  // 11-realtime/04-subscriptions-channels.md
  writeFile(docsDir, '11-realtime/04-subscriptions-channels.md', `---
id: subscriptions-channels
title: WebSocket Topic Subscriptions & Multiplexing
sidebar_label: Subscriptions & Channels
sidebar_position: 4
---

# WebSocket Topic Subscriptions & Multiplexing

<span className="badge-implemented">Implemented</span>

Clients subscribe to granular topics to prevent flooding low-bandwidth clients with irrelevant tactical data.

---

## Channel Multiplexing Protocol

Clients send JSON command messages over the active WebSocket connection:

\`\`\`json
{
  "action": "SUBSCRIBE",
  "channels": [
    "global",
    "incident:inc_remal_2024",
    "case:C-1048",
    "task:TSK-4091"
  ]
}
\`\`\`

- **\`global\`**: High-level national incident declarations and critical system alerts.
- **\`incident:<id>\`**: Detections, cases, weather warnings, and critical asset events for a specific AOI.
- **\`case:<id>\`**: Triage reviews, status transitions, and attached evidence for a single case.
- **\`task:<id>\`**: Field observations and ground verification updates.
`);

  // ===========================================================================
  // 12-data-integrations
  // ===========================================================================

  // 12-data-integrations/01-overview.md
  writeFile(docsDir, '12-data-integrations/01-overview.md', `---
id: overview
title: Multi-Source Disaster Telemetry Framework
sidebar_label: Ingestion Overview
sidebar_position: 1
---

# Multi-Source Disaster Telemetry Framework

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements an automated, resilient ingestion framework located in \`artifacts/api-server/src/services/ingestion-engine.ts\`. It polls national and global emergency monitoring agencies on deterministic cron schedules.

\`\`\`mermaid
flowchart LR
    subgraph Feeds["External Real-Time Feeds"]
        SACHET["SACHET NDMA (India CAP)"]
        USGS["USGS (Earthquakes)"]
        GDACS["GDACS (Global Disasters)"]
        FIRMS["NASA FIRMS (Thermal Hotspots)"]
        METEO["Open-Meteo & IMD (Weather)"]
    end

    subgraph Engine["IngestionEngine (src/services/ingestion-engine.ts)"]
        SCHED[Cron Scheduler]
        DEDUP[Deduplication by externalId]
        NORM[Schema Normalizer]
        DB[(PostgreSQL Store)]
    end

    Feeds --> SCHED --> DEDUP --> NORM --> DB
\`\`\`

---

## Feed Polling Schedules & Endpoints

| Provider | Telemetry Type | Endpoint / Protocol | Cron Frequency | Deduplication Key |
| :--- | :--- | :--- | :--- | :--- |
| **SACHET NDMA** | Common Alerting Protocol (CAP) | RSS/XML Feed | Every 10 min | \`sachet_<identifier>\` |
| **USGS** | Seismic Events (M &ge; 4.0) | GeoJSON HTTP Feed | Every 5 min | \`usgs_<id>\` |
| **GDACS** | Floods, Cyclones, Volcanoes | RSS & GeoJSON Feed | Every 15 min | \`gdacs_<eventid>\` |
| **NASA FIRMS** | VIIRS Active Thermal Hotspots | CSV Data Stream | Every 15 min | \`firms_<latitude>_<longitude>_<acq_time>\` |
| **Open-Meteo** | Hourly Precipitation & Wind | RESTful JSON API | Every 10 min | Spatial Centroid + Hour |
`);

  // 12-data-integrations/02-sachet-ndma.md
  writeFile(docsDir, '12-data-integrations/02-sachet-ndma.md', `---
id: sachet-ndma
title: SACHET NDMA (India CAP) Ingestion Engine
sidebar_label: SACHET NDMA
sidebar_position: 2
---

# SACHET NDMA (India CAP) Ingestion Engine

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:88\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L88-L140)
- **Standard**: OASIS Common Alerting Protocol (CAP-v1.2).
- **Functionality**: Parses XML alert feeds from India National Disaster Management Authority (NDMA), extracts multi-lingual descriptions (Hindi/English), affected district polygons, and parses severity levels (\`Extreme\`, \`Severe\`, \`Moderate\`).
`);

  // 12-data-integrations/03-usgs.md
  writeFile(docsDir, '12-data-integrations/03-usgs.md', `---
id: usgs
title: USGS Real-Time Earthquake Ingestion
sidebar_label: USGS Earthquakes
sidebar_position: 3
---

# USGS Real-Time Earthquake Ingestion

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:145\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L145-L210)
- **Endpoint**: \`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson\`
- **Filter**: Magnitude M >= 4.0. Calculates estimated Modified Mercalli Intensity (MMI) shake radius and intersects with populated municipal centers.

`);

  // 12-data-integrations/04-gdacs.md
  writeFile(docsDir, '12-data-integrations/04-gdacs.md', `---
id: gdacs
title: GDACS Multi-Hazard Alert Ingestion
sidebar_label: GDACS Alerts
sidebar_position: 4
---

# GDACS Multi-Hazard Alert Ingestion

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:215\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L215-L270)
- **Provider**: Global Disaster Alert and Coordination System (UN / European Commission).
- **Hazard Classes**: Tropical Cyclones (\`TC\`), Floods (\`FL\`), Earthquakes (\`EQ\`), Volcanic Eruptions (\`VO\`).
`);

  // 12-data-integrations/05-nasa-firms.md
  writeFile(docsDir, '12-data-integrations/05-nasa-firms.md', `---
id: nasa-firms
title: NASA FIRMS VIIRS Active Fire Hotspots
sidebar_label: NASA FIRMS
sidebar_position: 5
---

# NASA FIRMS VIIRS Active Fire Hotspots

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:275\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L275-L340)
- **Instrument**: Suomi NPP / NOAA-20 VIIRS 375m thermal imaging.
- **Processing**: Filters low-confidence detections, aggregates thermal clusters into fire fronts, and populates the \`fire_detections\` table.
`);

  // 12-data-integrations/06-nasa-eonet.md
  writeFile(docsDir, '12-data-integrations/06-nasa-eonet.md', `---
id: nasa-eonet
title: NASA EONET Earth Observatory Natural Events
sidebar_label: NASA EONET
sidebar_position: 6
---

# NASA EONET Earth Observatory Natural Events

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:345\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L345-L400)
- **Endpoint**: \`https://eonet.gsfc.nasa.gov/api/v3/events\`
- **Functionality**: Tracks long-duration global climate and severe storm phenomena with historical trajectory coordinates.
`);

  // 12-data-integrations/07-weather-apis.md
  writeFile(docsDir, '12-data-integrations/07-weather-apis.md', `---
id: weather-apis
title: Weather Telemetry (Open-Meteo & IMD)
sidebar_label: Weather Feeds
sidebar_position: 7
---

# Weather Telemetry (Open-Meteo & IMD)

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/ingestion-engine.ts:405\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L405-L480)
- **Parameters Ingested**: Precipitation rate (mm/h), wind gust velocity (km/h), barometric pressure, river basin runoff estimates. Populates \`weather_alerts\`.
`);

  // 12-data-integrations/08-osm-overpass.md
  writeFile(docsDir, '12-data-integrations/08-osm-overpass.md', `---
id: osm-overpass
title: OpenStreetMap Overpass QL Infrastructure Connector
sidebar_label: OSM Overpass
sidebar_position: 8
---

# OpenStreetMap Overpass QL Infrastructure Connector

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/osm-sync.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/osm-sync.ts)
- **Functionality**: Dynamically queries public Overpass endpoints (\`https://overpass-api.de/api/interpreter\`) with automatic failover to alternative community mirrors, extracting critical tags within incident AOIs.
`);

  // 12-data-integrations/09-copernicus-sentinel.md
  writeFile(docsDir, '12-data-integrations/09-copernicus-sentinel.md', `---
id: copernicus-sentinel
title: Copernicus CDSE Sentinel STAC & SAR Ingestion
sidebar_label: Copernicus Sentinel
sidebar_position: 9
---

# Copernicus CDSE Sentinel STAC & SAR Ingestion

<span className="badge-implemented">Implemented</span>

- **Source File**: [\`artifacts/api-server/src/services/sentinel-stac.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/sentinel-stac.ts)
- **STAC Catalog**: Copernicus Data Space Ecosystem (\`https://catalogue.dataspace.copernicus.eu/stac\`).
- **Sensors**: Sentinel-1 SAR (Synthetic Aperture Radar) C-band for cloud-penetrating flood mapping; Sentinel-2 MSI MultiSpectral Optical (10m bands).
`);

  // 12-data-integrations/10-waqi.md
  writeFile(docsDir, '12-data-integrations/10-waqi.md', `---
id: waqi
title: World Air Quality Index (WAQI) Smoke Telemetry
sidebar_label: WAQI Air Quality
sidebar_position: 10
---

# World Air Quality Index (WAQI) Smoke Telemetry

<span className="badge-implemented">Implemented</span>

- **Source File**: \`artifacts/api-server/src/services/ingestion-engine.ts:485\`
- **Telemetry**: Ground station particulate matter (PM2.5, PM10) and carbon monoxide (CO) sensor readings for wildfire smoke plumes and hazardous industrial leaks.
`);

  // ===========================================================================
  // 13-ai-ml
  // ===========================================================================

  // 13-ai-ml/01-ai-architecture.md
  writeFile(docsDir, '13-ai-ml/01-ai-architecture.md', `---
id: ai-architecture
title: Multimodal AI Architecture & Pipeline
sidebar_label: AI Architecture
sidebar_position: 1
---

# Multimodal AI Architecture & Pipeline

<span className="badge-implemented">Implemented</span>

DRAXELYRA incorporates a dual-provider multimodal AI architecture designed to execute satellite change detection, structural damage classification, and prompt-driven impact reasoning.

\`\`\`mermaid
flowchart TD
    subgraph Inputs["Multimodal Telemetry Inputs"]
        IMG_PRE[Pre-Disaster Baseline Imagery]
        IMG_POST[Post-Disaster Target Imagery]
        VEC_OSM[OSM Critical Asset Attributes]
        ENV_CTX[Hazard Type & Weather Conditions]
    end

    subgraph Factory["AIProviderFactory (src/ai/AIProviderFactory.ts)"]
        DECISION{GEMINI_API_KEY Available?}
        P_GEMINI["GeminiMultimodalProvider (@google/genai)"]
        P_MOCK["MockVisionAssessmentProvider (Baseline CV Engine)"]
    end

    subgraph Engine["Inference & Schema Parsing"]
        PROMPT[Catalog Prompt Template]
        LLM[Model Execution responseMimeType=application/json]
        ZOD[Zod DamageAssessmentOutputSchema]
    end

    subgraph Persistence["Storage & Decision Ledger"]
        DB_LOG[(PostgreSQL: ai_decision_logs)]
        CACHE[AICacheService: SHA-256 Hash Key]
    end

    Inputs --> Factory
    DECISION -->|Yes| P_GEMINI
    DECISION -->|No| P_MOCK
    P_GEMINI & P_MOCK --> PROMPT --> LLM --> ZOD --> CACHE --> DB_LOG
\`\`\`
`);

  // 13-ai-ml/02-gemini-multimodal.md
  writeFile(docsDir, '13-ai-ml/02-gemini-multimodal.md', `---
id: gemini-multimodal
title: Google Gemini 2.5 Flash Multimodal Provider
sidebar_label: Gemini Multimodal
sidebar_position: 2
---

# Google Gemini 2.5 Flash Multimodal Provider

<span className="badge-implemented">Implemented</span>

**Source File**: \`artifacts/api-server/src/ai/GeminiMultimodalProvider.ts\`

The production multimodal AI provider uses Google's official TypeScript SDK (\`@google/genai\`) to invoke **Gemini 2.5 Flash** with low temperature (0.1) and enforced JSON output schema.


\`\`\`typescript
import { GoogleGenAI } from '@google/genai';
import { DamageAssessmentOutputSchema } from './schemas';

export class GeminiMultimodalProvider implements MultimodalAssessmentProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async assessDamage(input: DamageAssessmentInput): Promise<DamageAssessmentOutput> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [
          { text: constructPrompt(input) },
          { inlineData: { mimeType: 'image/jpeg', data: input.postImageBase64 } }
        ]}
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      }
    });

    const parsedJson = JSON.parse(response.text!);
    return DamageAssessmentOutputSchema.parse(parsedJson);
  }
}
\`\`\`
`);

  // 13-ai-ml/03-mock-baseline.md
  writeFile(docsDir, '13-ai-ml/03-mock-baseline.md', `---
id: mock-baseline
title: Baseline Vision Assessment Mock Provider
sidebar_label: Baseline Vision Engine
sidebar_position: 3
---

# Baseline Vision Assessment Mock Provider

<span className="badge-implemented">Implemented</span>

**Source File**: [\`artifacts/api-server/src/ai/MockVisionAssessmentProvider.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/ai/MockVisionAssessmentProvider.ts)

When \`GEMINI_API_KEY\` is not present, DRAXELYRA seamlessly falls back to the deterministic baseline engine \`draxelyra-cv-baseline-v2\`. It simulates SAR backscatter coherence loss and optical MNDWI (Modified Normalized Difference Water Index) calculations.
`);

  // 13-ai-ml/04-prompt-engineering.md
  writeFile(docsDir, '13-ai-ml/04-prompt-engineering.md', `---
id: prompt-engineering
title: Prompt Engineering & Catalog Templates
sidebar_label: Prompt Engineering
sidebar_position: 4
---

# Prompt Engineering & Catalog Templates

<span className="badge-implemented">Implemented</span>

**Source File**: [\`artifacts/api-server/src/ai/prompts.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/ai/prompts.ts)

Prompt templates structure contextual hazard indicators, geospatial facility metadata, and few-shot examples while enforcing input sanitization to eliminate prompt injection risks from untrusted external feeds.
`);

  // 13-ai-ml/05-schemas-validation.md
  writeFile(docsDir, '13-ai-ml/05-schemas-validation.md', `---
id: schemas-validation
title: Zod Validation Schemas for AI Outputs
sidebar_label: Schemas & Validation
sidebar_position: 5
---

# Zod Validation Schemas for AI Outputs

<span className="badge-implemented">Implemented</span>

**Source File**: [\`artifacts/api-server/src/ai/schemas.ts\`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/ai/schemas.ts)

\`\`\`typescript
import { z } from 'zod';

export const DamageAssessmentOutputSchema = z.object({
  severity: z.enum(['DESTROYED', 'SEVERE', 'MODERATE', 'MINOR', 'NO_DAMAGE', 'UNCERTAIN']),
  confidenceScore: z.number().min(0.0).max(1.0),
  observedChanges: z.array(z.string()),
  infrastructureImpact: z.object({
    facilityOperational: z.boolean(),
    accessRoadsPassable: z.boolean(),
    floodDepthEstimatedCm: z.number().nullable(),
  }),
  reasoningNotes: z.string().min(10),
  uncertaintyFactors: z.array(z.string()),
});

export type DamageAssessmentOutput = z.infer<typeof DamageAssessmentOutputSchema>;
\`\`\`
`);

  // 13-ai-ml/06-ai-decision-logging.md
  writeFile(docsDir, '13-ai-ml/06-ai-decision-logging.md', `---
id: ai-decision-logging
title: AI Decision Logging & SHA-256 Caching
sidebar_label: Decision Logging & Cache
sidebar_position: 6
---

# AI Decision Logging & SHA-256 Caching

<span className="badge-implemented">Implemented</span>

Every AI inference invocation records an immutable entry in \`ai_decision_logs\` capturing the prompt version, model name, input SHA-256 hash, raw JSON response, token counts, and execution latency.
`);

  // 13-ai-ml/07-human-in-the-loop.md
  writeFile(docsDir, '13-ai-ml/07-human-in-the-loop.md', `---
id: human-in-the-loop
title: Human-in-the-Loop Triage & Model Evaluation
sidebar_label: Human-in-the-Loop
sidebar_position: 7
---

# Human-in-the-Loop Triage & Model Evaluation

<span className="badge-implemented">Implemented</span>

DRAXELYRA tracks the agreement rate between human duty officers and AI candidate detections. Human overrides, confirmed ground-truth findings, and rejected false alarms are curated in \`ai_evaluation_dataset\` for continuous model benchmark evaluation.
`);

}

