---
id: analytics
title: Analytics & Summary API Specification
sidebar_label: Analytics Endpoints
sidebar_position: 8
---

# Analytics & Summary API Specification

<span className="badge-implemented">Implemented</span>

---

### `GET /api/operations/summary`
Returns the global executive dashboard metrics (active incidents, unreviewed cases, active tasks, SLA breaches).
- **Roles**: All Authenticated.
- **Response**: `200 OK` KPI summary object.
