---
id: spatial-data
title: Spatial Data Management
sidebar_position: 6
---

# Spatial Data Models & Queries

<span className="badge-implemented">Implemented</span>

Geometries are stored in PostgreSQL `jsonb` columns (`aoi`, `location`, `geometry`).

- **Spatial Joins**: Detections are matched to nearby critical infrastructure assets by checking coordinate proximity within the incident AOI bounding box.
