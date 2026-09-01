---
id: nasa-firms
title: NASA FIRMS Active Thermal Hotspot Ingestion
sidebar_label: NASA FIRMS
sidebar_position: 5
---

# NASA FIRMS Active Thermal Hotspot Ingestion

<span className="badge-implemented">Implemented</span>

- **Source File**: [`artifacts/api-server/src/services/ingestion-engine.ts:275`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L275-L330)
- **Sensor**: VIIRS (375m spatial resolution) aboard Suomi NPP & NOAA-20 satellites.
- **Data Ingestion**: Parses Near-Real-Time (NRT) active fire thermal coordinates, brightness temperatures, and confidence categories (`nominal`, `high`).
