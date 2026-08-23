---
id: map-architecture
title: Map Architecture
sidebar_position: 2
---

# Map Architecture & Rendering Engine

<span className="badge-implemented">Implemented</span>

The map engine is built on **MapLibre GL** via `react-map-gl/maplibre`.

---

## Technical Stack

- **Renderer**: WebGL hardware-accelerated tile rendering.
- **Basemap Style**: Carto Voyager GL vector style (`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`).
- **Endpoint**: `GET /api/incidents/:id/map` delivers GeoJSON FeatureCollections for all active incident layers.
