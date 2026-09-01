---
id: indexeddb-queue
title: IndexedDB Request Queue & Mutation Buffering
sidebar_label: IndexedDB Queue
sidebar_position: 2
---

# IndexedDB Request Queue & Mutation Buffering

<span className="badge-implemented">Implemented</span>

The client-side offline storage engine is located in `artifacts/draxelyra/src/lib/offline-sync.ts`.

---

## IndexedDB Schema

- **Database Name**: `draxelyra-offline` (Version 1)
- **Object Store**: `syncQueue`
- **Key Path**: `id` (Auto-incrementing integer)

```typescript
export interface QueuedRequest {
  id?: number;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body: any;
  timestamp: string;
  expectedVersion?: number;
}
```

---

## Core Queue Operations

```typescript
export async function queueRequest(url: string, method: string, body: any, expectedVersion?: number): Promise<number> {
  const db = await openOfflineDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  
  const id = await store.add({
    url,
    method,
    body,
    timestamp: new Date().toISOString(),
    expectedVersion,
  });
  
  return id as number;
}
```
