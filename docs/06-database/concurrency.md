# Database Concurrency

<span className="badge-implemented">Implemented</span>

## Optimistic Concurrency Control (OCC)
DRAXELYRA implements OCC using a `version` column on critical tables such as `cases`, `tasks`, and `fieldObservations`.
This prevents lost updates during concurrent edits by multiple operators.

When a transition is made, the query checks that the current database version matches the expected version:
```sql
UPDATE cases
SET status = $1, version = version + 1
WHERE id = $2 AND version = $3
```

If 0 rows are affected, the system throws a `VERSION_CONFLICT` error, forcing the client to reload the latest state and retry.

## Transactions
All state transitions occur within a database transaction. For example:
```typescript
await db.transaction(async (tx) => {
  // 1. Update status and increment version
  // 2. Insert into caseStatusHistory
  // 3. Insert into auditEvents
});
```
This ensures atomicity; if the OCC check fails, the history and audit logs are rolled back.
