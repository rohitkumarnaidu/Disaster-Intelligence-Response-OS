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

export async function queueRequest(url: string, method: string, body: any) {
  const db = await getOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    store.add({ url, method, body, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueue(): Promise<any[]> {
  const db = await getOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearQueueItem(id: number) {
  const db = await getOfflineDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncAllPending(): Promise<{ synced: number; conflicts: any[] }> {
  const queue = await getQueue();
  let synced = 0;
  const conflicts: any[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body ? JSON.stringify(item.body) : undefined,
        credentials: "include"
      });

      if (res.status === 409) {
        const errorData = await res.json().catch(() => ({}));
        conflicts.push({ item, error: errorData });
      } else if (res.ok) {
        await clearQueueItem(item.id);
        synced++;
      }
    } catch (err) {
      console.warn("Failed to sync offline item:", item, err);
      // Keep in queue for next retry
    }
  }

  return { synced, conflicts };
}
