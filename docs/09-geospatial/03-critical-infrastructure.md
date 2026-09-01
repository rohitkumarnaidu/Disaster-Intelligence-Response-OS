---
id: critical-infrastructure
title: OpenStreetMap Critical Infrastructure Extraction
sidebar_label: Critical Infrastructure
sidebar_position: 3
---

# OpenStreetMap Critical Infrastructure Extraction

<span className="badge-implemented">Implemented</span>

When an incident is declared, the **Asset Enrichment Service** (`artifacts/api-server/src/services/osm-sync.ts`) interrogates the **OpenStreetMap Overpass API** to extract all life-critical facilities within the active theater.

---

## Overpass QL Query Architecture

```overpassql
[out:json][timeout:25];
(
  node["amenity"="hospital"](24.70,92.65,25.00,93.00);
  way["amenity"="hospital"](24.70,92.65,25.00,93.00);
  node["amenity"="clinic"](24.70,92.65,25.00,93.00);
  node["power"="substation"](24.70,92.65,25.00,93.00);
  node["man_made"="water_works"](24.70,92.65,25.00,93.00);
  way["highway"="bridge"](24.70,92.65,25.00,93.00);
  node["amenity"="school"](24.70,92.65,25.00,93.00);
);
out center body;
>;
out skel qt;
```

---

## Ingested Infrastructure Classifications

| OSM Tag Pattern | Internal Asset Type | Criticality Weight ($C$) | Tactical Priority |
| :--- | :--- | :--- | :--- |
| `amenity=hospital`, `amenity=clinic` | `HOSPITAL` | **100** | Life-safety, mass casualty receiving, surgical power. |
| `highway=bridge` | `BRIDGE` | **85** | Evacuation bottlenecks, logistics supply corridor. |
| `power=substation` | `POWER_SUBSTATION` | **75** | Grid stability, communication tower power. |
| `man_made=water_works` | `WATER_TREATMENT` | **75** | Potable drinking water, waterborne pathogen prevention. |
| `amenity=school` | `COMMUNITY_SHELTER` | **70** | Displaced population staging, emergency relief distribution. |
