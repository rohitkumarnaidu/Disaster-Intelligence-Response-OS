# Cases API Reference

### `GET /api/cases`
Returns ranked cases joined with critical assets and detections.

### `GET /api/cases/:id`
Retrieves detailed case payload including factor breakdown and imagery dates.

### `POST /api/cases/:id/review`
Submit a human review decision.
- **Permissions**: Analyst, Commander, Disaster Officer, Manager, Admin
- **Request Body**: `{ "decision": "confirmed", "notes": "Ground-floor flood verified", "version": 1 }`
- **Response (200)**: `{ "success": true, "newStatus": "CONFIRMED", "priorityScore": 83, "version": 2 }`
- **Error (409)**: `{ "error": { "code": "VERSION_CONFLICT", "message": "The record changed on the server." } }`

### `GET /api/cases/:id/audit`
Returns chronological audit events for the specified case.
