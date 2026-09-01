---
id: usgs
title: USGS Real-Time Earthquake Ingestion
sidebar_label: USGS Earthquakes
sidebar_position: 3
---

# USGS Real-Time Earthquake Ingestion

<span className="badge-implemented">Implemented</span>

- **Source File**: [`artifacts/api-server/src/services/ingestion-engine.ts:145`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L145-L210)
- **Endpoint**: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson`
- **Filter**: Magnitude $M ge 4.0$. Calculates estimated Modified Mercalli Intensity (MMI) shake radius and intersects with populated municipal centers.
