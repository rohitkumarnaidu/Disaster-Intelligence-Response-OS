# Optimistic Concurrency Control (OCC)

<span className="badge-implemented">Implemented</span>

Compare-And-Swap SQL updates prevent race conditions:

```sql
UPDATE cases
SET status = $1, version = version + 1, updated_at = NOW()
WHERE id = $2 AND version = $3
RETURNING *;
```
