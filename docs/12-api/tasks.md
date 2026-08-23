# Tasks API

<span className="badge-implemented">Implemented</span>

### 1. `GET /api/tasks`
- **Description**: Lists response tasks with SLA status.
- **Access**: Authenticated users.

### 2. `POST /api/tasks`
- **Description**: Dispatches a new field response task linked to a confirmed case.
- **Access**: `manager`, `commander`, `system_admin`.
- **Request Body**:
  ```json
  {
    "caseId": "C-1048",
    "title": "Hospital Power & Access Inspection",
    "priority": 83,
    "assignedTeam": "Public Works & Hazmat",
    "dueAt": "2026-08-25T12:00:00Z"
  }
  ```

### 3. `PATCH /api/tasks/:id`
- **Description**: Updates task status (`IN_PROGRESS`, `BLOCKED`, `COMPLETED`, `VERIFIED`) with OCC version check.
