# Pages & Views

<span className="badge-implemented">Implemented</span>

This document details the functionality of every major route and view within the DRAXELYRA frontend.

## Dashboard & Command

### `CommandCenter` (`/`)
The primary operational overview.
- **KPI Metrics**: Displays 6 top-level metrics (e.g., Active Incidents, Total Cases, Unassigned Tasks).
- **Minimap**: A small contextual map showing the global active areas.
- **Top 4 Cases**: A brief list of the most critical cases demanding attention.
- **Owned Tasks**: Tasks assigned to the currently logged-in user.
- **Activity Feed**: A scrolling feed of recent system events.
- **Data Fetching**: Utilizes `useGetCommandSummary` with a 60-second polling interval to keep commanders updated without manual refreshes.

## Incidents Management

### `Incidents` (`/incidents`)
The global registry of all crisis incidents (e.g., "Hurricane Delta", "Region 4 Earthquake").
- Uses `useListIncidents` to fetch the tabular registry.

### `IncidentDetail` (`/incidents/:id`)
Deep dive into a specific incident.
- Displays metadata, a timeline of events, and a focused Area of Interest (AOI) minimap.
- Powered by `useGetIncident(id)`.

## Triage & Assessment

### `Assessment` (`/assessment`)
A map-first workspace designed for situational awareness and initial triage.
- Features heavy layer toggles (infrastructure, detections, weather).
- Powered by `useListCases` to populate map points.

### `Cases` (`/cases`)
The priority queue. A dense data table view of all cases.
- Sorted by priority score and confidence level.
- Designed for bulk review and filtering.

### `CaseDetail` (`/cases/:id`)
The comprehensive view for a single case.
- **Before/After Imagery**: Side-by-side or slider views of satellite imagery.
- **Priority Ledger**: Explains exactly how the Priority Engine calculated the score.
- **Response Card**: Actionable area to spawn tasks or change case status.

### `Review` (`/review/:id`)
The Human-in-the-loop (HITL) adjudication screen.
- Allows analysts to quickly cycle through AI-detected cases.
- Actions: Confirm, Reject, or mark Uncertain.
- Triggers `useReviewCase()`, which actively invalidates the `['incident-map']` cache to update the map globally.

## Response & Operations

### `Tasks` (`/tasks`)
A Kanban board visualizing task progression.
- Columns: Queued, In Progress, Completed.
- Drag-and-drop or click-to-move interactions via `useUpdateTask()`.

### `TaskDetail` (`/tasks/:id`)
Detailed inspection of a single task.
- Shows assignment details, SLA timers, and a verification checklist.

### `Field` (`/field`)
A mobile-optimized interface for on-the-ground responders.
- Heavily relies on offline sync capabilities.
- Allows capturing evidence (photos, notes) which queue locally if connectivity drops.

## System & Analytics

### `Analytics` (`/analytics`)
Deeper insights into operational efficiency.
- Charts: Funnel charts for case progression, scatter plots (Confidence vs Priority).
- Metrics: SLA adherence by team.

### `Demo` (`/demo`)
A specialized engine for scenario simulation.
- 5-step progress UI.
- Actions: `useLoadDemo()` to seed database state, `useResetDemo()` to clear it.

### `Settings` (`/settings`)
Configuration interface.
- Lists demo user directory.
- Toggles for integration adapters (mock vs real systems).\n