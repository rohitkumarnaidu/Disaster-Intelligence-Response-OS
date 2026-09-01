---
id: map-engine
title: WebGL Map Engine & Multi-Layer Rendering
sidebar_label: Map Engine
sidebar_position: 1
---

# WebGL Map Engine & Multi-Layer Rendering

<span className="badge-implemented">Implemented</span>

The primary geospatial interface in DRAXELYRA is powered by **MapLibre GL JS** encapsulated via `react-map-gl/maplibre` in `artifacts/draxelyra/src/components/map/IncidentMap.tsx`.

```mermaid
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
```

---

## Layer Configuration & Color Semantics

| Layer Identifier | Geometry Type | Data Source | Styling Rules & Tactical Semantics |
| :--- | :--- | :--- | :--- |
| `aoi-fill` | `Polygon` | `incident.aoi` | Fill `#259184`, Opacity `0.08`. Delineates operational response theater. |
| `aoi-outline` | `LineString` | `incident.aoi` | Color `#259184`, Width `2px`, DashArray `[2, 2]`. |
| `detections-heat`| `Point` | `detections` | Kernel density weighting based on model confidence score (0.0 to 1.0). |
| `critical-assets`| `Point` | `critical_assets` | Red circle for Hospitals (`#E53E3E`), Blue for Substations (`#3182CE`), Orange for Bridges (`#DD6B20`). |
| `cases-status` | `Point` | `cases` | Yellow for `NEEDS_REVIEW`, Teal for `CONFIRMED`, Crimson for `REJECTED`, Grey for `CLOSED`. |
| `field-obs` | `Point` | `field_observations`| Green pulsing beacon for verified ground truth reports with attached photos. |
