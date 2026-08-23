---
id: indexeddb
title: IndexedDB Storage
sidebar_position: 3
---

# IndexedDB Storage Implementation

<span className="badge-implemented">Implemented</span>

The offline storage engine is implemented in `artifacts/draxelyra/src/lib/offline-sync.ts`:

```typescript
export async function getOfflineDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("draxelyra-offline", 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
```
