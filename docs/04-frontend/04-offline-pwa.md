# Offline PWA Capabilities

<span className="badge-implemented">Implemented</span>

Field responders require continuous operation regardless of network reliability. DRAXELYRA utilizes Progressive Web App (PWA) technologies to ensure availability and data integrity during outages.

## Service Worker

**Source:** `public/sw.js`

The Service Worker intercepts network requests and manages the application cache.
- **Cache Name**: `draxelyra-v1`
- **Install Phase**: Caches the application shell (e.g., `/`, index.html, core CSS/JS) and immediately calls `skipWaiting()` to activate the new worker.
- **Activate Phase**: Claims all active clients, taking control immediately.
- **Fetch Strategy**:
  - Ignores non-GET requests.
  - Specifically bypasses any URLs containing `/api/` to prevent caching dynamic backend responses in the static cache.
  - Serves the cached application shell for navigation requests, allowing the app to boot offline.

## Offline Sync Engine

**Source:** `src/lib/offline-sync.ts`

When the app is offline, mutations (POST, PUT, DELETE) are intercepted and stored locally.

### IndexedDB Storage
- **Database**: `draxelyra-offline`, version 1.
- **Object Store**: `syncQueue`
  - Configured with `keyPath: 'id'` and `autoIncrement: true`.

### Core Exports
1. `getOfflineDB()`: Initializes and returns the IndexedDB connection.
2. `queueRequest(url, method, body)`: Serializes the failed API request and stores it in the `syncQueue`.
3. `getQueue()`: Retrieves all pending requests.
4. `clearQueueItem(id)`: Removes a request from the queue after successful synchronization.

### Conflict Resolution UI
The application monitors `navigator.onLine`. When connectivity is restored, a background process attempts to flush the `syncQueue`. If conflicts occur (e.g., a Case was updated by someone else, resulting in a Version Conflict), the UI presents a resolution dialog to the user, allowing them to force their update or pull the latest server state.\n