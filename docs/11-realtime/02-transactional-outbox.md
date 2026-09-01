---
id: transactional-outbox
title: Transactional Outbox Pattern & Zero Event Loss
sidebar_label: Transactional Outbox
sidebar_position: 2
---

# Transactional Outbox Pattern & Zero Event Loss

<span className="badge-implemented">Implemented</span>

To guarantee that domain events are never lost if the server restarts or network partitions occur during an API call, DRAXELYRA utilizes the **Transactional Outbox Pattern** in `artifacts/api-server/src/realtime/outbox.ts`.

```mermaid
sequenceDiagram
    participant API as Route Handler
    participant DB as PostgreSQL (Single ACID Transaction)
    participant Outbox as outbox_events Table
    participant Dispatcher as Outbox Dispatcher Worker
    participant WS as WebSocket Gateway

    API->>DB: BEGIN Transaction
    API->>DB: UPDATE cases SET status="CONFIRMED", version=3
    API->>Outbox: INSERT INTO outbox_events (status="PENDING", eventType="CASE_CONFIRMED")
    DB-->>API: COMMIT Transaction

    loop Polling Interval (Every 500ms)
        Dispatcher->>Outbox: SELECT * FROM outbox_events WHERE status='PENDING' LIMIT 50 FOR UPDATE SKIP LOCKED
        Outbox-->>Dispatcher: Batch of Pending Events
        Dispatcher->>WS: Broadcast to Subscribed Channels
        Dispatcher->>Outbox: UPDATE outbox_events SET status='DISPATCHED', dispatched_at=NOW()
    end
```
