---
id: state-management
title: State Management & TanStack Query Cache
sidebar_label: State Management
sidebar_position: 4
---

# State Management & TanStack Query Cache

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a clean separation between **Server State** (managed via TanStack Query v5) and **Local UI State** (managed via React hooks).

---

## Server State & Query Keys

TanStack Query manages all remote API data. Standardized query keys enable precise, surgical cache invalidations:

| Entity | Primary Query Key | Invalidation Trigger |
| :--- | :--- | :--- |
| **Command Summary** | `['command-summary', incidentId?]` | Realtime event `CASE_CREATED`, `TASK_ASSIGNED`, or 30s interval |
| **Incidents List** | `['incidents']` | Realtime event `INCIDENT_CREATED`, `INCIDENT_UPDATED` |
| **Single Incident** | `['incident', incidentId]` | Incident status change |
| **Cases Queue** | `['cases']`, `['/api/cases']` | `CASE_CONFIRMED`, `CASE_REJECTED`, `CASE_TASKED` |
| **Single Case** | `['case', caseId]` | Review submission or OCC conflict refresh |
| **Tasks Board** | `['tasks']`, `['/api/tasks']` | `TASK_ASSIGNED`, `TASK_VERIFIED`, `TASK_COMPLETED` |
| **Incident Map** | `['incident-map', incidentId]` | Any case status transition within the active AOI |
| **Audit Activity** | `['audit-timeline']`, `['audit', caseId]` | Any domain mutation emitting `AUDIT_EVENT_CREATED` |

---

## Cache Invalidation Strategy

When the WebSocket gateway receives a domain event, the `useLiveEvents()` hook executes targeted query invalidations:

```typescript
switch (event.entityType) {
  case 'CASE':
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    queryClient.invalidateQueries({ queryKey: ['command-summary'] });
    queryClient.invalidateQueries({ queryKey: ['incident-map'] });
    if (event.entityId) {
      queryClient.invalidateQueries({ queryKey: ['case', event.entityId] });
    }
    break;
  case 'TASK':
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['command-summary'] });
    break;
}
```
