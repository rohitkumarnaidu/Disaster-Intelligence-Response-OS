---
id: cases
title: Cases API Specification
sidebar_label: Cases Endpoints
sidebar_position: 3
---

# Cases API Specification

<span className="badge-implemented">Implemented</span>

Handles human adjudication, priority triage, and case lifecycle transitions.

---

### `GET /api/cases`
Fetches prioritized operational cases with filtering by `status`, `incidentId`, and `minPriority`.
- **Roles**: All Authenticated.
- **Response**: `200 OK` Array of case records with priority breakdowns.

---

### `POST /api/cases/:id/review`
Adjudicates an AI candidate detection, enforcing OCC version checking.
- **Roles**: `Duty Officer`, `Incident Commander`.
- **Request Body**:
  ```json
  {
    "decision": "CONFIRMED",
    "expectedVersion": 2,
    "notes": "Verified severe standing water flooding ground floor hospital trauma center."
  }
  ```
- **Response**:
  - `200 OK`: Case transitioned to `CONFIRMED` with `version: 3`.
  - `409 Conflict`: Version mismatch error envelope.
