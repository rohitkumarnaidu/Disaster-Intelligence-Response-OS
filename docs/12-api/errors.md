# Error Codes Reference

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `BAD_REQUEST` | 400 | Payload failed schema validation. |
| `UNAUTHORIZED` | 401 | Missing or expired session cookie. |
| `FORBIDDEN` | 403 | User role lacks required permission. |
| `NOT_FOUND` | 404 | Target entity does not exist. |
| `VERSION_CONFLICT` | 409 | Concurrent mutation detected (OCC CAS failed). |
| `INVALID_TRANSITION`| 422 | Requested state transition is disallowed by state machine. |
| `SERVER_ERROR` | 500 | Unhandled server exception. |
