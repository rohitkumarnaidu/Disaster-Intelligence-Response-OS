---
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

**Source File**: [`artifacts/api-server/src/utils/geo.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/utils/geo.ts)

```typescript
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
```

---

## Spatial Query Performance
- Bounding box calculations run in $mathcal{O}(N)$ where $N$ is the vertex count of the AOI perimeter.
- PostgreSQL GIN indexes on `jsonb` columns support containment searches:
  ```sql
  SELECT * FROM cases WHERE aoi @> '{"coordinates": [92.79, 24.83]}';
  ```
