# UI Components & Primitives

<span className="badge-implemented">Implemented</span>

The frontend utilizes a combination of Radix UI primitives and custom tactical components:

- **`Metric`**: Displays KPI counters with trend badges and status color accents.
- **`Badge`**: Renders standardized status markers (`badge-implemented`, `badge-dev`, `badge-mock`, `badge-planned`).
- **`IncidentMap`**: MapLibre GL wrapper component rendering GeoJSON layers with popup tooltips.
- **`AuditTimeline`**: Chronological visual feed of actor decisions and state mutations.
- **`ErrorBoundary`**: Global error wrapper catching rendering exceptions with reset buttons.
