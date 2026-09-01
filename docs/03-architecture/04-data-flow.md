---
id: data-flow
title: Data Flow & End-to-End Lineage
sidebar_label: Data Flow
sidebar_position: 4
---

# Data Flow & End-to-End Lineage

<span className="badge-implemented">Implemented</span>

This document illustrates the end-to-end data lineage across DRAXELYRA—from raw external satellite swath and hazard feed ingestion to automated spatial enrichment, priority scoring, human adjudication, field verification, and after-action outcome reporting.

```mermaid
flowchart TD
    subgraph ExternalSources["1. Multi-Source Raw Feeds"]
        E1[Copernicus CDSE STAC<br/>Sentinel-1 SAR / Sentinel-2]
        E2[USGS Earthquakes API<br/>GeoJSON Feed M ≥ 4.0]
        E3[GDACS Alerts<br/>Multi-Hazard RSS & GeoJSON]
        E4[SACHET NDMA<br/>India CAP XML Feeds]
        E5[NASA FIRMS<br/>VIIRS Active Fire CSV]
        E6[OpenStreetMap<br/>Overpass QL Infrastructure]
    end

    subgraph Normalization["2. Ingestion & Normalization Layer"]
        N1[IngestionEngine Workers]
        N2[Schema Normalizer & Validator]
        N3[Spatial Bounding Box Clipper]
    end

    subgraph Datastore["3. Relational Datastore (PostgreSQL)"]
        D1[(disaster_events / weather_alerts)]
        D2[(incidents & AOI Polygons)]
        D3[(osm_critical_assets)]
        D4[(imagery_assets & imagery_pairs)]
        D5[(detections & ai_decision_logs)]
        D6[(cases status=DETECTED)]
        D7[(tasks status=ASSIGNED)]
        D8[(field_observations)]
        D9[(outcomes & audit_events)]
    end

    subgraph AnalyticsAI["4. AI & Priority Computation"]
        A1[Multimodal AI Vision Provider]
        A2[5-Factor Priority Scoring Engine]
    end

    subgraph HumanOps["5. Human Operations & Field Execution"]
        H1[Duty Officer Triage Modal]
        H2[Incident Commander Tasking]
        H3[Field Responder Offline PWA]
        H4[Executive Analytics Dashboard]
    end

    E1 & E2 & E3 & E4 & E5 --> N1
    N1 --> N2 --> N3
    N3 --> D1 & D2
    D2 --> E6 --> D3

    D4 & D3 --> A1 --> D5
    D5 & D3 --> A2 --> D6

    D6 --> H1 --> D6
    D6 --> H2 --> D7
    D7 --> H3 --> D8
    D8 --> H2 --> D9
    D9 --> H4
```

---

## Data Transformation Pipeline

1. **Ingestion & Deduplication**: External APIs are polled at defined intervals (5m for USGS, 10m for Weather, 15m for GDACS/FIRMS). Records are deduplicated by `externalId` to prevent duplicate incident creation.
2. **Spatial Intersection**: Ingested AOI bounding boxes query OpenStreetMap Overpass for critical nodes within a 5km radius.
3. **Multimodal Analysis**: Paired before/after satellite swaths generate structured detections with damage classification and confidence metrics.
4. **Priority Scoring**: Features are normalized to standard scales ($0	ext{--}100$) and weighted to yield an integer priority score.
5. **Transactional Lineage**: Every operational record maintains foreign keys back to its originating detection, imagery asset, and external event ID, ensuring full audit traceability.
