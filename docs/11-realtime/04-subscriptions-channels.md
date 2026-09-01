---
id: subscriptions-channels
title: WebSocket Topic Subscriptions & Multiplexing
sidebar_label: Subscriptions & Channels
sidebar_position: 4
---

# WebSocket Topic Subscriptions & Multiplexing

<span className="badge-implemented">Implemented</span>

Clients subscribe to granular topics to prevent flooding low-bandwidth clients with irrelevant tactical data.

---

## Channel Multiplexing Protocol

Clients send JSON command messages over the active WebSocket connection:

```json
{
  "action": "SUBSCRIBE",
  "channels": [
    "global",
    "incident:inc_remal_2024",
    "case:C-1048",
    "task:TSK-4091"
  ]
}
```

- **`global`**: High-level national incident declarations and critical system alerts.
- **`incident:<id>`**: Detections, cases, weather warnings, and critical asset events for a specific AOI.
- **`case:<id>`**: Triage reviews, status transitions, and attached evidence for a single case.
- **`task:<id>`**: Field observations and ground verification updates.
