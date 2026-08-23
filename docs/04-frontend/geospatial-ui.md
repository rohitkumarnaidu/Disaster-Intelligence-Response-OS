# Geospatial UI Implementation

<span className="badge-implemented">Implemented</span>

The geospatial workspace in `artifacts/draxelyra/src/components/map/IncidentMap.tsx` is built on **MapLibre GL** via `react-map-gl/maplibre`.

- **Vector Basemap**: Carto Voyager GL style (`https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json`).
- **Dynamic GeoJSON Sources**: Fetched via `GET /api/incidents/:id/map` and rendered as separate WebGL layers:
  - `aoi-layer`: Semi-transparent polygon fill and dashed stroke for the operational zone.
  - `assets-layer`: Neutral circles showing hospitals, power substations, and bridges.
  - `detections-layer`: Red circles indicating candidate structural change detections.
  - `cases-layer`: Priority-colored interactive circles with click-to-open case inspection.
