# Cases API

<span className="badge-implemented">Implemented</span>

### 1. `GET /api/cases`
- **Description**: Retrieves prioritized operational triage queue.
- **Query Parameters**: `incidentId`, `status`, `minPriority`.
- **Response (`200 OK`)**: List of cases joined with critical assets and detections.

### 2. `POST /api/cases/:id/review`
- **Description**: Submits human triage decision with Optimistic Concurrency Control (OCC).
- **Access**: `analyst`, `commander`, `system_admin`.
- **Request Body**:
  ```json
  {
    "decision": "confirmed",
    "notes": "Satellite imagery confirms significant structural inundation.",
    "version": 1
  }
  ```
- **Concurrency Handling**: If `version` does not match current database version, returns `409 Conflict` with `VERSION_CONFLICT`.
- **Audit Logging**: Appends an event to `audit_events` recording decision, actor, and timestamp.

### 3. `GET /api/cases/:id/audit`
- **Description**: Returns complete chronological audit history for the case.
