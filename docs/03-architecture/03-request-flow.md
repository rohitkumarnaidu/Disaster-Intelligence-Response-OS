# Request Flow

<span className="badge-implemented">Implemented</span>

Understanding the lifecycle of an API request is critical for debugging and extending the backend. DRAXELYRA uses a strict middleware chain to process incoming HTTP requests before they reach the route handlers.

## Standard API Request Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant Express as Express App
    participant Auth as Auth Middleware
    participant Route as Route Handler
    participant Service as Business Service
    participant DB as PostgreSQL

    Client->>Express: POST /api/cases/123/status
    Express->>Express: pinoHttp (Logging)
    Express->>Express: cors (CORS headers)
    Express->>Express: express.json (Body parsing)
    Express->>Express: session (Cookie parsing)
    Express->>Auth: requireAuth / requireRole
    Auth-->>Express: 401 Unauthorized (if failed)
    Auth->>Route: next()
    Route->>Service: transitionCase(...)
    Service->>DB: BEGIN
    DB-->>Service: OK
    Service->>DB: UPDATE cases ... WHERE version = expected
    DB-->>Service: rowCount
    Service->>DB: COMMIT
    Service-->>Route: updated case
    Route-->>Client: 200 OK (JSON)
```

## Middleware Chain (Actual Audit)

Source: `artifacts/api-server/src/app.ts`

1. **pinoHttp**: Structured JSON logging. Redacts sensitive data.
2. **cors**: Configured with `origin: true` and `credentials: true`.
3. **express.json**: Parses `application/json` payloads.
4. **express.urlencoded**: Parses `application/x-www-form-urlencoded`.
5. **express-session**: Backed by `connect-pg-simple`. Uses 30-day secure HTTP-only cookies.
6. **Static File Server**: Serves files from `/uploads`.
7. **API Router**: Mounts modular route groups at `/api`.\n