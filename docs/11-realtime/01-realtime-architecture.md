---
id: realtime-architecture
title: Real-Time Messaging Architecture & Channels
sidebar_label: Realtime Architecture
sidebar_position: 1
---

# Real-Time Messaging Architecture & Channels

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a hybrid real-time communication fabric combining **WebSockets (`/ws`)**, **Server-Sent Events (`/api/events`)**, and the browser **`BroadcastChannel` API**.

```mermaid
flowchart TD
    subgraph Clients["EOC Operator Clients"]
        T1[Browser Tab 1]
        T2[Browser Tab 2]
        BC[BroadcastChannel: draxelyra_realtime_sync]
    end

    subgraph RealtimeServer["Express & WebSocket Gateway"]
        WS_GW["WebSocketServer (/ws)"]
        SSE_GW["SSE Controller (/api/events)"]
        REGISTRY["Client Subscription Registry"]
    end

    subgraph Data["Outbox Poller"]
        OUTBOX["outbox_events Table"]
        POLLER["Transactional Outbox Worker"]
    end

    T1 <-->|WebSocket Connection| WS_GW
    T2 <-->|WebSocket Connection| WS_GW
    T1 <-->|Local Tab Sync| BC <--> T2

    OUTBOX --> POLLER --> WS_GW & SSE_GW
    WS_GW --> REGISTRY
```

---

## Protocol Comparison

| Capability | WebSocket (`/ws`) | Server-Sent Events (`/api/events`) | BroadcastChannel API |
| :--- | :--- | :--- | :--- |
| **Direction** | Bidirectional (Duplex) | Unidirectional (Server $	o$ Client) | Client-side Cross-Tab Sync |
| **Authentication** | Session cookie on WS handshake | Session cookie on HTTP stream | Same-origin browser memory |
| **Heartbeat** | 25-second Ping/Pong | 15-second SSE comment `:keepalive` | None (Local process) |
| **Primary Use** | Real-time case updates & alerts | Firewall-restricted fallback | Prevents redundant WS connections |
