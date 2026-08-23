---
id: geojson
title: GeoJSON Specifications
sidebar_position: 3
---

# GeoJSON Schemas & Specifications

<span className="badge-implemented">Implemented</span>

The map API returns an aggregated JSON payload containing standard RFC 7946 GeoJSON collections:

```json
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
```
