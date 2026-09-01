---
id: osm-overpass
title: OpenStreetMap Overpass QL Infrastructure Connector
sidebar_label: OSM Overpass
sidebar_position: 8
---

# OpenStreetMap Overpass QL Infrastructure Connector

<span className="badge-implemented">Implemented</span>

- **Source File**: [`artifacts/api-server/src/services/osm-sync.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/osm-sync.ts)
- **Functionality**: Dynamically queries public Overpass endpoints (`https://overpass-api.de/api/interpreter`) with automatic failover to alternative community mirrors, extracting critical tags within incident AOIs.
