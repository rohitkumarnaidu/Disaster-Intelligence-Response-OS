# Backend Architecture

<span className="badge-implemented">Implemented</span>

The Node.js backend is designed as a robust, stateless API layer sitting in front of a PostgreSQL database.

## Entry Point

**Source:** `artifacts/api-server/src/index.ts`

The boot process is straightforward:
- Reads the `PORT` from environment variables.
- Validates that `PORT` is numeric and > 0.
- Calls `app.listen(port)`.
- Logs the successful startup using the Pino logger.

## Express App & Middleware Chain

**Source:** `artifacts/api-server/src/app.ts`

The middleware chain is executed in the following EXACT order. This order is critical for security and payload parsing.

1. **`pinoHttp`**: 
   - Configured with `logger` and serializers: `{ req: sanitize URL, res: statusCode }`.
   - Provides structured JSON logging for every request.
2. **`cors`**: 
   - Configured with `origin: true` and `credentials: true` (permissive for current dev/staging).
3. **`express.json()`**: 
   - Parses incoming JSON payloads into `req.body`.
4. **`express.urlencoded({ extended: true })`**: 
   - Parses URL-encoded bodies.
5. **`express-session`**:
   - Store: `connect-pg-simple` (PostgreSQL-backed sessions).
   - Table: `session` in PostgreSQL.
   - Secret: `process.env.SESSION_SECRET || 'draxelyra_default_secret'`.
   - Cookie config: `httpOnly: true`, `secure: NODE_ENV === 'production'`, `maxAge: 30 * 24 * 60 * 60 * 1000` (30 days).
   - Settings: `resave: false`, `saveUninitialized: false`.
6. **Static File Serving**: 
   - `express.static('uploads')` mounted at `/uploads` to serve uploaded evidence.
7. **API Router**: 
   - All core logic is mounted at `/api`.

## Route Mounting

**Source:** `routes/index.ts`

- `/api/health` → `healthRouter`
- `/api/auth` → `authRouter`
- `/api/incidents` → `incidentsRouter`
- `/api/cases` → `casesRouter`
- `/api/tasks` → `tasksRouter`
- `/api/analytics` → `analyticsRouter`
- `/api/demo` → `demoRouter`
- `/api/evidence` → `evidenceRouter`
- `/api/` → `operationsRouter` (handles command summary and audit logs)

## Authentication Middleware

**Source:** `middlewares/auth.ts`

- **`requireAuth(req, res, next)`**: Checks for `req.session?.userId`. If missing, returns 401 with payload: `{ error: { code: 'UNAUTHORIZED' } }`.
- **`requireRole(...roles)`**: First checks auth (401), then verifies if `roles.includes(req.session.role)`. Returns 403 FORBIDDEN if the user lacks clearance.

## Pino Logger

**Source:** `lib/logger.ts`

- **Level**: `process.env.LOG_LEVEL ?? 'info'`.
- **Redactions**: Prevents leaking secrets to logs. Redacts `req.headers.authorization`, `req.headers.cookie`, and `res.headers['set-cookie']`.
- **Transport**: Uses `pino-pretty` in development for human-readable logs, and outputs raw JSON in production environments.\n