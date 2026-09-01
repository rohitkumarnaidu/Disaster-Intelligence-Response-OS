---
id: auth-rbac
title: Authentication, Sessions & RBAC Matrix
sidebar_label: Authentication & RBAC
sidebar_position: 1
---

# Authentication, Sessions & RBAC Matrix

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces session-based authentication backed by PostgreSQL and a granular 6-tier Role-Based Access Control (RBAC) model designed for emergency management hierarchies.

---

## Session Management Architecture

- **Session Store**: `connect-pg-simple` storing active sessions directly in the PostgreSQL `session` table.
- **Session Cookie**: `connect.sid`, signed using `SESSION_SECRET`.
- **Security Flags**:
  - `httpOnly: true` (prevents JavaScript XSS cookie extraction).
  - `secure: NODE_ENV === 'production'` (requires HTTPS in production).
  - `sameSite: 'lax'` (protects against Cross-Site Request Forgery).
  - `maxAge: 30 * 24 * 60 * 60 * 1000` (30-day session lifetime).

---

## 6 System Roles & Operational Clearance

| Role Identifier | Operational Title | Primary Mission & Responsibilities |
| :--- | :--- | :--- |
| **`System Administrator`** | System Administrator | Infrastructure management, external API credentials, user directory, system configuration. |
| **`Incident Commander`** | Incident Commander | Strategic authority. Declares incident states, authorizes high-risk tasks, approves final after-action outcomes. |
| **`Duty Officer`** | EOC Duty Officer | Operational watchstander. Triages AI candidate detections, reviews evidence, confirms cases, sets task priorities. |
| **`GIS Analyst`** | Geospatial Intelligence Analyst | Manages satellite imagery swaths, AOI polygons, Overpass OSM sync, runs change-detection workflows. |
| **`Field Lead`** | Tactical Field Coordinator | Assigns response tasks to field teams, monitors SLA adherence, validates incoming field observations. |
| **`Field Responder`** | Ground Operations Responder | Operates mobile PWA in disaster zone. Executes on-site damage verification, captures geotagged photos. |

---

## RBAC Permissions Matrix Across API Endpoints

| Resource & Operation | Endpoint | Permitted Roles |
| :--- | :--- | :--- |
| **View Command Center** | `GET /api/operations/summary` | All Authenticated Roles |
| **Create Incident** | `POST /api/incidents` | `System Administrator`, `Incident Commander` |
| **Update Incident Status**| `PATCH /api/incidents/:id` | `Incident Commander` |
| **STAC Satellite Search** | `POST /api/imagery/search` | `GIS Analyst`, `Incident Commander` |
| **Trigger OSM Overpass** | `POST /api/integrations/osm/sync`| `GIS Analyst`, `System Administrator` |
| **Adjudicate AI Case** | `POST /api/cases/:id/review` | `Duty Officer`, `Incident Commander` |
| **Spawn Task from Case** | `POST /api/tasks` | `Duty Officer`, `Incident Commander`, `Field Lead` |
| **Update Task Status** | `PATCH /api/tasks/:id` | `Field Lead`, `Incident Commander` |
| **Submit Field Observation**| `POST /api/field/observations` | `Field Responder`, `Field Lead` |
| **Upload File Evidence** | `POST /api/evidence` | All Authenticated Roles |
| **Publish Outcome Report**| `POST /api/outcomes` | `Incident Commander` |
| **Manage Users & System** | `POST /api/admin/users` | `System Administrator` |

---

## Middleware Guards

**Source File**: [`artifacts/api-server/src/middlewares/auth.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/middlewares/auth.ts)

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication session required.' }
    });
  }
  next();
}

export function requireRole(...permittedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      if (!permittedRoles.includes(req.session.role!)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Role '${req.session.role}' is not authorized for this operation.`
          }
        });
      }
      next();
    });
  };
}
```
