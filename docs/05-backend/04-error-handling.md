---
id: error-handling
title: Backend Error Handling & HTTP Envelopes
sidebar_label: Error Handling
sidebar_position: 4
---

# Backend Error Handling & HTTP Envelopes

<span className="badge-implemented">Implemented</span>

The API server emits standardized JSON error payloads conforming to a unified structure across all endpoints.

---

## Error Envelope Specification

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The record changed on the server.",
    "serverVersion": 3,
    "serverRecord": { "id": "C-1048", "status": "CONFIRMED", "version": 3 }
  }
}
```

---

## Standard Error Codes

| HTTP Status | Error Code | Trigger Condition |
| :--- | :--- | :--- |
| **400** | `BAD_REQUEST` | Missing required parameters or malformed JSON payload. |
| **401** | `UNAUTHORIZED` | Missing or expired session cookie. |
| **403** | `FORBIDDEN` | User role lacks sufficient permissions for the endpoint. |
| **404** | `NOT_FOUND` | Requested incident, case, task, or evidence record does not exist. |
| **409** | `VERSION_CONFLICT` | Optimistic concurrency conflict (`expectedVersion !== record.version`). |
| **422** | `INVALID_TRANSITION` | Requested FSM state transition is disallowed by domain rules. |
| **500** | `SERVER_ERROR` | Internal database or unhandled server exception. |
