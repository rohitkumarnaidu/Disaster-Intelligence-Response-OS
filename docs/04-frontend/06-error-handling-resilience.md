---
id: error-handling-resilience
title: Frontend Error Handling & UI Resilience
sidebar_label: Error Handling & Resilience
sidebar_position: 6
---

# Frontend Error Handling & UI Resilience

<span className="badge-implemented">Implemented</span>

The frontend provides multiple defensive layers to isolate component crashes, handle API outages, and recover from concurrency conflicts.

---

## Error Boundaries

**Source File**: [`artifacts/draxelyra/src/components/error-boundary.tsx`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/components/error-boundary.tsx)

1. **Root Error Boundary**: Wraps the entire application. Catches uncaught render crashes and provides a "Reload Operating System" recovery screen.
2. **Map Error Boundary**: Wraps `IncidentMap`. If MapLibre WebGL context fails (e.g., hardware acceleration disabled), renders a fallback vector list without crashing the command dashboard.

---

## Concurrency Conflict Handling (HTTP 409)

When an operator submits a case review for a stale version:
1. The API responds with HTTP 409 `VERSION_CONFLICT`.
2. The UI intercepts the error, displays an amber toast alert (*"Record was updated by another operator"*), and automatically refetches the latest server record.
