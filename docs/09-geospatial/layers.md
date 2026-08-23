---
id: layers
title: Map Layers
sidebar_position: 4
---

# Map Layer Hierarchy & Styling

<span className="badge-implemented">Implemented</span>

| Layer ID | Source | Geometry | Styling Rules |
| :--- | :--- | :--- | :--- |
| `aoi-layer` | `aoi` | Polygon | Fill: `#259184`, Opacity: `0.10` |
| `aoi-layer-line` | `aoi` | LineString | Stroke: `#259184`, Width: 2, Dasharray: `[2, 2]` |
| `assets-layer` | `criticalAssets` | Point | Circle radius: `8px`, Color: `#4a5568`, Stroke: `#ffffff` |
| `detections-layer` | `detections` | Point / Polygon | Circle radius: `4px`, Color: `#cd372f`, Opacity: `0.6` |
| `cases-layer` | `cases` | Point | Radius: `6px`, Color based on status: NEEDS_REVIEW (`#EFAC30`), CONFIRMED (`#259184`), REJECTED (`#cd372f`) |
| `observations-layer` | `fieldObservations` | Point | Radius: `5px`, Color: `#259184`, Stroke: `#ffffff` |
