---
id: sync-replay-occ
title: FIFO Sync Replay & OCC Conflict Resolution
sidebar_label: Sync Replay & OCC
sidebar_position: 3
---

# FIFO Sync Replay & OCC Conflict Resolution

<span className="badge-implemented">Implemented</span>

When a field responder's device regains connectivity, the replay engine processes buffered requests in strict FIFO sequence.

---

## Replay Execution Loop

```typescript
export async function syncAllPending(): Promise<{ synced: number; conflicts: number }> {
  const queue = await getQueue();
  let synced = 0;
  let conflicts = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        await clearQueueItem(item.id!);
        synced++;
      } else if (response.status === 409) {
        // Concurrency conflict occurred on server while device was offline
        conflicts++;
        await handleSyncConflict(item, await response.json());
      }
    } catch (err) {
      console.warn('Network interrupted during replay, pausing queue.', err);
      break;
    }
  }

  return { synced, conflicts };
}
```
