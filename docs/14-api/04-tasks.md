---
id: tasks
title: Tasks API Specification
sidebar_label: Tasks Endpoints
sidebar_position: 4
---

# Tasks API Specification

<span className="badge-implemented">Implemented</span>

Manages field response work orders and dynamic SLA tracking.

---

### `POST /api/tasks`
Spawns a new response task linked to a confirmed case.
- **Roles**: `Duty Officer`, `Incident Commander`, `Field Lead`.
- **Request Body**:
  ```json
  {
    "caseId": "C-1048",
    "title": "Deploy High-Capacity De-Watering Pumps",
    "taskType": "DEWATERING",
    "assignedUnit": "NDRF 1st Bn Team B"
  }
  ```
- **Response**: `201 Created` Task object with computed `slaDeadline`.

---

### `POST /api/tasks/:id/verify`
Verifies task completion with physical evidence.
- **Roles**: `Field Lead`, `Incident Commander`.
- **Request Body**:
  ```json
  {
    "expectedVersion": 2,
    "verificationStatus": "CONFIRMED_DAMAGED",
    "notes": "Pumps operational. Flood level decreased by 45cm."
  }
  ```
- **Response**: `200 OK` Task transitioned to `VERIFIED`.
