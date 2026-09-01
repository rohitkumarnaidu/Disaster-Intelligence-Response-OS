---
id: concurrency-occ
title: Optimistic Concurrency Control (OCC) Mechanics
sidebar_label: Concurrency & OCC
sidebar_position: 3
---

# Optimistic Concurrency Control (OCC) Mechanics

<span className="badge-implemented">Implemented</span>

In multi-agency emergency operations centers, multiple duty officers, GIS analysts, and field leads concurrently inspect and update identical crisis cases. DRAXELYRA implements **Optimistic Concurrency Control (OCC)** using a Compare-and-Swap (CAS) atomic database update pattern.

---

## The Monotonic Version Column

Every mutable domain table (`cases`, `tasks`, `incidents`, `field_observations`) contains an integer `version` column initialized to `1`.

Whenever an update occurs, the backend executes an atomic Compare-and-Swap SQL mutation inside a transaction:

```sql
UPDATE cases
SET status = $1,
    priority_score = $2,
    version = version + 1,
    updated_at = NOW()
WHERE id = $3 AND version = $4
RETURNING *;
```

---

## Compare-and-Swap Transition Algorithm

**Source File**: [`artifacts/api-server/src/services/case-state-machine.ts:45`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/services/case-state-machine.ts#L45-L85)

```typescript
export async function transitionCase(
  caseId: string,
  targetStatus: CaseStatus,
  userId: string,
  expectedVersion: number,
  notes?: string
) {
  return await db.transaction(async (tx) => {
    // 1. Fetch current database record
    const [current] = await tx.select().from(cases).where(eq(cases.id, caseId));
    if (!current) {
      throw { code: 'NOT_FOUND', message: `Case ${caseId} not found` };
    }

    // 2. Validate version match (OCC Guard)
    if (current.version !== expectedVersion) {
      throw {
        code: 'VERSION_CONFLICT',
        message: `Case ${caseId} has been modified by another operator.`,
        serverVersion: current.version,
        serverRecord: current,
      };
    }

    // 3. Validate state machine transition graph
    validateTransition(current.status, targetStatus);

    // 4. Execute atomic update with version increment
    const [updated] = await tx
      .update(cases)
      .set({
        status: targetStatus,
        version: expectedVersion + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, caseId), eq(cases.version, expectedVersion)))
      .returning();

    // 5. Insert immutable status history & outbox domain event
    await tx.insert(caseStatusHistory).values({
      caseId,
      fromStatus: current.status,
      toStatus: targetStatus,
      userId,
      reason: notes,
      version: expectedVersion + 1,
    });

    await tx.insert(outboxEvents).values({
      eventType: 'CASE_CONFIRMED',
      entityType: 'CASE',
      entityId: caseId,
      version: expectedVersion + 1,
      payload: updated,
    });

    return updated;
  });
}
```

---

## Client Conflict Recovery Flow

When a client receives HTTP 409 `VERSION_CONFLICT`:
1. The client intercepts the response payload containing `serverVersion` and `serverRecord`.
2. The UI displays an amber conflict banner: *"This record was modified by another operator. Latest changes have been loaded."*
3. The local form state is refreshed with the new `serverVersion`, allowing the operator to re-verify their notes against the latest data and resubmit without data loss.
