---
id: sachet-ndma
title: SACHET NDMA (India CAP) Ingestion Engine
sidebar_label: SACHET NDMA
sidebar_position: 2
---

# SACHET NDMA (India CAP) Ingestion Engine

<span className="badge-implemented">Implemented</span>

- **Source File**: [`artifacts/api-server/src/services/ingestion-engine.ts:88`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/ingestion-engine.ts#L88-L140)
- **Standard**: OASIS Common Alerting Protocol (CAP-v1.2).
- **Functionality**: Parses XML alert feeds from India National Disaster Management Authority (NDMA), extracts multi-lingual descriptions (Hindi/English), affected district polygons, and parses severity levels (`Extreme`, `Severe`, `Moderate`).
