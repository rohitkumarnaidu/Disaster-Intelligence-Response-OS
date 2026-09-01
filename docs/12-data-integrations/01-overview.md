---
id: overview
title: Multi-Source Disaster Telemetry Framework
sidebar_label: Ingestion Overview
sidebar_position: 1
---

# Multi-Source Disaster Telemetry Framework

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements an automated, resilient ingestion framework located in `artifacts/api-server/src/services/ingestion-engine.ts`. It polls national and global emergency monitoring agencies on deterministic cron schedules.

```mermaid
flowchart LR
    subgraph Feeds["External Real-Time Feeds"]
        SACHET["SACHET NDMA (India CAP)"]
        USGS["USGS (Earthquakes)"]
        GDACS["GDACS (Global Disasters)"]
        FIRMS["NASA FIRMS (Thermal Hotspots)"]
        METEO["Open-Meteo & IMD (Weather)"]
    end

    subgraph Engine["IngestionEngine (src/services/ingestion-engine.ts)"]
        SCHED[Cron Scheduler]
        DEDUP[Deduplication by externalId]
        NORM[Schema Normalizer]
        DB[(PostgreSQL Store)]
    end

    Feeds --> SCHED --> DEDUP --> NORM --> DB
```

---

## Feed Polling Schedules & Endpoints

| Provider | Telemetry Type | Endpoint / Protocol | Cron Frequency | Deduplication Key |
| :--- | :--- | :--- | :--- | :--- |
| **SACHET NDMA** | Common Alerting Protocol (CAP) | RSS/XML Feed | Every 10 min | `sachet_<identifier>` |
| **USGS** | Seismic Events (M $ge$ 4.0) | GeoJSON HTTP Feed | Every 5 min | `usgs_<id>` |
| **GDACS** | Floods, Cyclones, Volcanoes | RSS & GeoJSON Feed | Every 15 min | `gdacs_<eventid>` |
| **NASA FIRMS** | VIIRS Active Thermal Hotspots | CSV Data Stream | Every 15 min | `firms_<latitude>_<longitude>_<acq_time>` |
| **Open-Meteo** | Hourly Precipitation & Wind | RESTful JSON API | Every 10 min | Spatial Centroid + Hour |
