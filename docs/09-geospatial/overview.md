---
id: overview
title: Geospatial Overview
sidebar_position: 1
---

# Geospatial Overview

<span className="badge-implemented">Implemented</span>

Geospatial data forms the operational canvas of DRAXELYRA. The platform integrates satellite observations, cadastral facility layers, and field tracks into unified interactive maps.

```mermaid
flowchart TD
    A[Incident AOI Polygon] --> M[MapLibre GL Map Canvas]
    B[Critical Infrastructure Points] --> M
    C[AI Damage Detections] --> M
    D[Prioritized Operational Cases] --> M
    E[Field Responder GPS Observations] --> M
    M --> F[Duty Officer Triage Interface]
```
