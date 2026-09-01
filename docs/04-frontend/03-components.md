---
id: components
title: Component Hierarchy & UI Design System
sidebar_label: Component Hierarchy
sidebar_position: 3
---

# Component Hierarchy & UI Design System

<span className="badge-implemented">Implemented</span>

The frontend utilizes a component hierarchy separating core domain widgets from low-level Radix UI primitives.

---

## Core Domain Components

### 1. `IncidentMap` (`src/components/map/IncidentMap.tsx`)
- **Map Engine**: MapLibre GL wrapped with `react-map-gl/maplibre`.
- **Basemap Layers**: Carto Dark Matter vector tiles with fallback to ArcGIS World Imagery raster tiles (`server.arcgisonline.com`).
- **GeoJSON Layers**:
  - `aoi-boundary`: Incident operational extent polygon.
  - `critical-assets`: Vector points styled by facility type (Hospitals in Red, Substations in Blue).
  - `detections-heatmap`: Density layer rendering flood/damage anomaly clusters.
  - `fire-hotspots`: NASA FIRMS VIIRS active thermal coordinates.

### 2. `AIAssessmentPanel` (`src/components/ai/AIAssessmentPanel.tsx`)
- Renders structured multimodal change assessment outputs.
- Displays observed changes, infrastructure impacts, uncertainty caveats, and model token usage.

### 3. `AIAnalyticsDashboard` (`src/components/ai/AIAnalyticsDashboard.tsx`)
- Renders operational funnel graphs, human vs AI agreement matrices, and false positive ratios.

### 4. `LineageGraph` (`src/components/LineageGraph.tsx`)
- Visualizes the end-to-end cryptographic data lineage from external satellite product to field-verified outcome.

### 5. `LiveFeedIndicator` (`src/components/LiveFeedIndicator.tsx`)
- Header indicator displaying real-time WebSocket connection state (`LIVE`, `RECONNECTING`, `OFFLINE`) and ping latency.
