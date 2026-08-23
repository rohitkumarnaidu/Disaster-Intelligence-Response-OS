# Frontend Routing

<span className="badge-implemented">Implemented</span>

Client-side routing is configured in `artifacts/draxelyra/src/App.tsx` using **Wouter**.

| Route | Component / View | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/` | `Overview` | Executive situational awareness dashboard | Yes |
| `/incidents` | `Incidents` | Incident registry & new incident creation | Yes |
| `/incidents/:id` | `IncidentDetail` | Incident telemetry & AOI parameters | Yes |
| `/assessment` | `Assessment` | MapLibre geospatial triage console | Yes |
| `/cases` | `Cases` | Explainable priority triage queue | Yes |
| `/cases/:id` | `CaseDetail` | Detailed case factors & audit history | Yes |
| `/review/:id` | `Review` | Evidence review & decision workspace | Yes |
| `/tasks` | `Tasks` | Response task dispatch board & SLA monitor | Yes |
| `/field` | `Field` | Tactical field responder inspection console | Yes |
| `/analytics` | `Analytics` | Incident progression funnel & performance | Yes |
| `/demo` | `DemoReplay` | Scenario replay & dataset loader | Yes (Admin) |
| `/login` | `LoginPage` | Tactical authentication screen | No |
