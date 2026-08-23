# Core Systems Reference

<span className="badge-implemented">Implemented</span>

This reference manual documents the exhaustive list of enumerations, strict data statuses, and authorization matrices utilized across the DRAXELYRA operating environment.

## Status Enumerable Values

The platform strictly tracks states using explicit enumerable fields. All state transitions must adhere to these sets.

### Case Statuses
- `DETECTED`: Initial system or user identification.
- `NEEDS_REVIEW`: Requires human verification.
- `CONFIRMED`: Validation passed, case is active.
- `REJECTED`: Marked as invalid or non-actionable.
- `UNCERTAIN`: Insufficient data to verify.
- `PRIORITIZED`: Escalated for immediate attention.
- `TASKED`: Action items generated and dispatched.
- `IN_PROGRESS`: Active mitigation underway.
- `FIELD_VERIFIED`: Ground truth confirmed by field ops.
- `ACTIONED`: Direct intervention applied.
- `CLOSED`: Case concluded.

### Task Statuses
- `UNASSIGNED`: Pending resource allocation.
- `ASSIGNED`: Personnel allocated, awaiting acknowledgment.
- `IN_PROGRESS`: Task execution active.
- `BLOCKED`: Execution halted due to external dependencies.
- `COMPLETED`: Execution finished.
- `VERIFIED`: Completion confirmed by oversight.
- `CLOSED`: Final archival state.

### Review Statuses
- `PENDING`: Awaiting intelligence review.
- `CONFIRMED`: Intelligence validated.
- `REJECTED`: Intelligence discarded.
- `UNCERTAIN`: Requires further corroboration.

### Incident Statuses
- `Active`: Incident requires ongoing management.
- `Closed`: Incident is resolved.

## Role-Based Access Control (RBAC) Permissions Matrix

Security is enforced via granular endpoint authorizations mapping to predefined organizational roles.

| Endpoint | System Admin | Org Admin | Commander | Disaster Officer | Manager | Analyst | Field Responder |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `POST /incidents` | ✓ | ✓ | — | ✓ | — | — | — |
| `PATCH /incidents/:id` | ✓ | ✓ | — | ✓ | — | — | — |
| `POST /cases/:id/review` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| `GET /cases/:id/audit` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /tasks` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| `PATCH /tasks/:id` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `POST /evidence/upload` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /demo/load` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Environment Variables Reference

| Variable | Usage Context | Type | Description |
|----------|---------------|------|-------------|
| `DATABASE_URL` | Backend | String | Standard libpq connection string. Example: `postgresql://user:pass@host:5432/db` |
| `PORT` | Backend | Integer | Binding port for the Express HTTP server. |
| `SESSION_SECRET` | Backend | String | Cryptographic key for signing session cookies. Must be rotated regularly in prod. |
| `LOG_LEVEL` | Universal | Enum | Specifies Pino's minimum output severity. |
| `VITE_PORT` | Frontend | Integer | Port utilized by the Vite HMR server in local development. |
| `BASE_PATH` | Frontend | String | Application routing root (useful for sub-directory deployments). |
| `NODE_ENV` | Universal | String | Enables framework-specific production optimizations when set to `production`. |
