---
id: sync-engine
title: Sync Engine
sidebar_position: 4
---

# Synchronization Engine

<span className="badge-implemented">Implemented</span>

- **Mutation Interception**: `customFetch` in `lib/api-client-react/src/custom-fetch.ts` intercepts network failures when `!navigator.onLine` for non-GET requests.
- **Queue Enqueueing**: Serializes URL, HTTP method, and JSON body into `syncQueue`.
- **Sequential Replay**: Replays queued mutations in strict chronological order upon network reconnection.
