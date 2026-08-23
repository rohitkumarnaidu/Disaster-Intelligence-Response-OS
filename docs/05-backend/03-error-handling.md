# Error Handling

<span className="badge-implemented">Implemented</span>

The backend utilizes a standardized JSON error envelope for all client responses. This ensures the frontend can parse errors predictably.

## The Error Envelope

Every failed request returns a payload structured like this:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description",
    "details": {} 
  }
}
```

## HTTP Status Codes Mapping

We strictly map domain errors to appropriate HTTP status codes:

- **400 Bad Request**: Validation failures (e.g., Zod schema parsing fails).
  - `code`: `VALIDATION_ERROR`
  - `details`: Array of specific field errors.
- **401 Unauthorized**: Missing or invalid session.
  - `code`: `UNAUTHORIZED`
- **403 Forbidden**: Valid session, but insufficient role permissions.
  - `code`: `FORBIDDEN`
- **404 Not Found**: Resource does not exist (Case, Task, Incident).
  - `code`: `NOT_FOUND`
- **409 Conflict**: Optimistic Concurrency Control failure.
  - `code`: `VERSION_CONFLICT`
  - Triggered when `expectedVersion` does not match the database.
- **422 Unprocessable Entity**: Business logic violations.
  - `code`: `INVALID_STATE_TRANSITION`
  - Triggered by the state machine services.
- **500 Internal Server Error**: Uncaught exceptions.
  - `code`: `INTERNAL_ERROR`
  - Stack traces are stripped in production.

## Example: Version Conflict Response

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The case was modified by another user. Please refresh and try again.",
    "details": {
      "providedVersion": 4,
      "currentVersion": 5
    }
  }
}
```\n