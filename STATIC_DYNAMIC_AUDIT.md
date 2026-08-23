# Static vs Dynamic Audit

## 1. Operational Fallback Data (Mock Data)
- **STATIC:** Previously, the UI defined fallbackCases, fallbackTasks, and fallbackIncident right in the application payload. The map loaded fake markers.
- **DYNAMIC:** All fallback data has been purged from App.tsx. The frontend relies completely on the backend API (powered by TanStack query). The map source uses valid geojson populated from real detections (/api/incidents/:id/map).

## 2. Dynamic Audit UI
- **STATIC:** Earlier revisions had hardcoded audit steps. 
- **DYNAMIC:** The AuditTimeline and the backend AuditEvents table now persist all actions dynamically. The CaseDetail renders full contextual audit strings fetched via /api/cases/:id/audit. Actor name and role resolution is live.

## 3. Dynamic Analytics
- **STATIC:** The dashboard rendered fake percentages and zeros.
- **DYNAMIC:** The /api/analytics/overview endpoint iterates over actual auditEvents, cases, and tasks to generate real metrics like averageTimeToAssess, slaCompliance, and actual case states. 

## 4. Conflict Resolution UI (Field Offline Sync)
- **STATIC:** Previously, conflict resolution merely threw an alert.
- **DYNAMIC:** The system executes a full 3-way conflict view allowing "Keep Server", "Apply Local", or "Merge" when an offline sync returns HTTP 409. 

## 5. Security Enforcements
- **STATIC:** /api/demo/load was entirely open and unauthenticated.
- **DYNAMIC:** The system has properly implemented requireAuth and requireRole logic for system reconfiguration endpoints.

**Status:** The system is fully DYNAMIC.
