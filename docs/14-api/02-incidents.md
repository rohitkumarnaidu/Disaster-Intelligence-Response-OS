---
id: incidents
title: Incidents API Specification
sidebar_label: Incidents Endpoints
sidebar_position: 2
---

# Incidents API Specification

<span className="badge-implemented">Implemented</span>

Manages disaster incident aggregate theaters, boundaries, and spatial map layers.

---

### `GET /api/incidents`
Lists all active, monitoring, and archived disaster incidents.
- **Roles**: All Authenticated.
- **Response**: `200 OK` Array of incident records.

---

### `POST /api/incidents`
Declares a new operational crisis aggregate.
- **Roles**: `System Administrator`, `Incident Commander`.
- **Request Body**:
  ```json
  {
    "name": "Cyclone Remal Response",
    "disasterType": "CYCLONE",
    "severity": "CRITICAL",
    "aoi": {
      "type": "Polygon",
      "coordinates": [[[92.65, 24.70], [93.00, 24.70], [93.00, 25.00], [92.65, 25.00], [92.65, 24.70]]]
    },
    "startTime": "2024-05-26T00:00:00.000Z",
    "source": "IMD"
  }
  ```
- **Response**: `201 Created` Incident object with `version: 1`.

---

### `GET /api/incidents/:id/map`
Returns the unified GeoJSON map DTO containing the AOI perimeter, critical assets, AI detections, cases, and field observations for WebGL rendering.
- **Roles**: All Authenticated.
- **Response**: `200 OK` GeoJSON FeatureCollections bundle.
