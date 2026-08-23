# System Operations and Maintenance

<span className="badge-implemented">Implemented</span>

Maintaining the DRAXELYRA platform involves monitoring system health, managing the monorepo workspace, and utilizing standardized troubleshooting procedures to resolve common operational issues.

## Monorepo Architecture

The codebase is organized using `pnpm` workspaces, explicitly separating operational artifacts from shared libraries.

File: `pnpm-workspace.yaml`
```yaml
packages:
  - "artifacts/*"
  - "lib/*"
```

### Directory Structure

```text
DRAXELYRA-Response-OS/
├── artifacts/
│   ├── api-server/         # Express 5 backend executable
│   └── draxelyra/          # React 19 + Vite frontend
├── lib/
│   ├── db/                 # Drizzle ORM models and PostgreSQL schemas
│   ├── api-spec/           # Central OpenAPI 3.1 YAML definition
│   ├── api-zod/            # Generated Zod validation schemas
│   └── api-client-react/   # Generated TanStack Query hooks
```

This modularity ensures that the backend and frontend are tightly coupled via generated API client code but decoupled in their specific operational lifecycles.

## Observability and Logging

The system relies on `pino` for high-performance, low-overhead logging.

- **Level Configuration**: Controlled via the `LOG_LEVEL` environment variable. The default is `info`. Available levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.
- **Development Output**: Utilizes `pino-pretty` to output formatted, color-coded logs to standard output.
- **Production Output**: Emits raw JSON streams suitable for ingestion by platforms like Datadog, ELK stack, or CloudWatch.

### Redaction Rules

To maintain security compliance, the logger automatically redacts sensitive headers in all incoming requests and outgoing responses.

File: `artifacts/api-server/src/logger.ts`
```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]'
  ]
});
```

## Troubleshooting Playbook

### 1. Database Connection Refused

**Symptoms:**
Logs output `error: connection to server at "localhost" (::1), port 5433 failed: Connection refused`.

**Resolution Steps:**
1. Check running Docker containers: `docker compose ps`
2. Verify the port mappings. The local development database is mapped to `5433` (to avoid conflicts with standard local postgres on `5432`).
3. Ensure `DATABASE_URL` points to `postgresql://postgres:postgres@localhost:5433/draxelyra`.

### 2. 401 Unauthorized API Responses

**Symptoms:**
The frontend fails to fetch data with a `401` status code logged in the network tab.

**Resolution Steps:**
1. The session may have expired. Force a clear of local storage and cookies in the browser.
2. Re-authenticate via the login interface.
3. If the problem persists, verify the `SESSION_SECRET` matches across deployments if operating behind a load balancer.

### 3. 409 Version Conflict (Optimistic Concurrency)

**Symptoms:**
Updating an entity (like a Case or Task) yields a `409 Conflict`.

**Resolution Steps:**
1. This is an expected operational constraint enforcing optimistic concurrency control.
2. The client must re-fetch the latest entity state to acquire the current version number before re-attempting the mutation.

### 4. Drizzle Schema Push Fails

**Symptoms:**
`pnpm --filter @workspace/db run push` exits with code 1.

**Resolution Steps:**
1. Confirm the `DATABASE_URL` environment variable is exported in the current shell.
2. Ensure the postgres container is actually healthy.
