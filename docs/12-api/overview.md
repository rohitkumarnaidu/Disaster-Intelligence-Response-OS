# REST API Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA REST API is built with **Express 5** and governed by the **OpenAPI 3.1** specification located at `lib/api-spec/openapi.yaml`.

---

## Base URL & Transport

- **Base Endpoint**: `http://localhost:5000/api` (or configured `PORT`)
- **Protocol**: HTTP/1.1 and HTTP/2 over TLS in production
- **Content Type**: `application/json` (except `/api/evidence/upload` which uses `multipart/form-data`)
- **Authentication**: HTTP-only secure cookie session (`connect.sid`)

---

## Global HTTP Response Envelope

Standard successful responses return the raw entity or array payload with appropriate HTTP status codes (`200 OK`, `201 Created`).

Error responses return a structured error envelope:

```json
{
  "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VERSION_CONFLICT | SERVER_ERROR",
  "message": "Human readable description of the error",
  "details": {}
}
```
