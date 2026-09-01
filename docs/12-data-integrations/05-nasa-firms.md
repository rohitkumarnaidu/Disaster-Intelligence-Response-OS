---
id: nasa-firms
title: NASA FIRMS VIIRS Active Fire Hotspots
sidebar_label: NASA FIRMS
sidebar_position: 5
---

# NASA FIRMS VIIRS Active Fire Hotspots

<span className="badge-implemented">Implemented</span>

- **Source File**: [`artifacts/api-server/src/services/ingestion-engine.ts:275`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L275-L340)
- **Instrument**: Suomi NPP / NOAA-20 VIIRS 375m thermal imaging.
- **Processing**: Filters low-confidence detections, aggregates thermal clusters into fire fronts, and populates the `fire_detections` table.
