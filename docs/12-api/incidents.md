# Incidents API

<span className="badge-implemented">Implemented</span>

### 1. `GET /api/incidents`
- **Description**: Lists all recorded disaster incidents.
- **Access**: Authenticated users.
- **Response (`200 OK`)**: Array of incident objects.

### 2. `POST /api/incidents`
- **Description**: Registers a new operational incident and AOI boundary.
- **Access**: `system_admin`, `commander`, `org_admin`.
- **Request Body**:
  ```json
  {
    "name": "Chennai Urban Flood Response",
    "disasterType": "Urban flood",
    "severity": "critical",
    "aoi": {
      "type": "Polygon",
      "coordinates": [[[80.15, 13.0], [80.30, 13.0], [80.30, 13.15], [80.15, 13.15], [80.15, 13.0]]]
    }
  }
  ```

### 3. `GET /api/incidents/:id/map`
- **Description**: Returns aggregated GeoJSON FeatureCollections for the incident AOI, critical assets, detections, prioritized cases, and field observations.
- **Access**: Authenticated users.
