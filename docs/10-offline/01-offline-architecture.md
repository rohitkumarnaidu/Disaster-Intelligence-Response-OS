---
id: offline-architecture
title: Offline-First Field Architecture
sidebar_label: Offline Architecture
sidebar_position: 1
---

# Offline-First Field Architecture

<span className="badge-implemented">Implemented</span>

DRAXELYRA treats catastrophic network outages as a standard operational environment. The mobile Progressive Web App (PWA) operates continuously in air-gapped disaster sectors.

```mermaid
flowchart TD
    subgraph Client["Field Device Browser / PWA"]
        UI[Field Observation Form]
        IDB[("IndexedDB (draxelyra-offline / syncQueue)")]
        SW[Service Worker (/sw.js)]
        STATUS[Network Monitor navigator.onLine]
    end

    subgraph Transport["Network Layer"]
        CONN{Connection Status?}
    end

    subgraph Backend["API Server Gateway"]
        API[POST /api/field/observations]
        OCC[OCC Concurrency Checker]
        DB[(PostgreSQL)]
    end

    UI --> IDB
    STATUS --> CONN
    CONN -->|Offline| IDB
    CONN -->|Online Reconnection| FLUSH[syncAllPending Replay Worker]
    FLUSH --> IDB
    FLUSH --> API --> OCC --> DB
```

---

## Offline Subsystem Pillars

1. **Static App Shell Caching (`/sw.js`)**: Service Worker caches all JavaScript, CSS, HTML, and icon assets on first load, enabling cold-boot without internet.
2. **IndexedDB Local Storage (`draxelyra-offline`)**: Unsynchronized mutations are serialized into IndexedDB.
3. **Automated Replay Engine (`syncAllPending`)**: Replays queued requests sequentially in FIFO order when connectivity returns.
