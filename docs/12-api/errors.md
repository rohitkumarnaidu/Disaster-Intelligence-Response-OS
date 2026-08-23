# API Error Codes & Handling

| HTTP Status | Error Code | Example Payload |
| :--- | :--- | :--- |
| **400** | `BAD_REQUEST` | `{ "error": { "code": "BAD_REQUEST", "message": "Email and password required" } }` |
| **401** | `UNAUTHORIZED` | `{ "error": { "code": "UNAUTHORIZED", "message": "Not authenticated" } }` |
| **403** | `FORBIDDEN` | `{ "error": { "code": "FORBIDDEN", "message": "Insufficient permissions" } }` |
| **404** | `NOT_FOUND` | `{ "error": { "code": "NOT_FOUND", "message": "Case not found" } }` |
| **409** | `VERSION_CONFLICT`| `{ "error": { "code": "VERSION_CONFLICT", "serverVersion": 2 } }` |
| **409** | `INVALID_TRANSITION` | `{ "error": { "code": "INVALID_TRANSITION", "message": "Cannot transition from CLOSED to TASKED" } }` |
