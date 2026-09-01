---
id: integrations
title: Integrations & Telemetry API Specification
sidebar_label: Integrations Endpoints
sidebar_position: 7
---

# Integrations & Telemetry API Specification

<span className="badge-implemented">Implemented</span>

---

### `POST /api/integrations/sync`
Triggers an immediate polling cycle across all external data feeds (USGS, GDACS, SACHET).
- **Roles**: `System Administrator`, `Incident Commander`.
- **Response**: `200 OK` Sync summary with counts of ingested alerts.

---

### `POST /api/integrations/osm/sync`
Triggers OpenStreetMap Overpass extraction for the active incident AOI.
- **Response**: `200 OK` Count of ingested critical assets.
