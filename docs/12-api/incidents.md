---
id: incidents
title: Incidents API
sidebar_position: 3
---

# Incidents API Reference

### `GET /api/incidents`
List all disaster incidents ordered by update time descending.

### `POST /api/incidents`
Create a new disaster incident.
- **Permissions**: System Admin, Organization Admin, Disaster Officer
- **Request Body**: `{ "name": "Skagit Valley Flood", "disasterType": "River Flood", "severity": "high", "aoi": { ... } }`
- **Response (201)**: `{ "id": "inc-174000...", "name": "...", ... }`

### `GET /api/incidents/:id`
Retrieve full operational details for an incident.

### `GET /api/incidents/:id/map`
Returns aggregated GeoJSON layers (`aoi`, `cases`, `criticalAssets`, `detections`, `fieldObservations`).
