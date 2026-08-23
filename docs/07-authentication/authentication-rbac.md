# Authentication & RBAC

<span className="badge-implemented">Implemented</span>

## Session Management
Authentication is handled via session cookies backed by PostgreSQL using `connect-pg-simple`.

**Configuration (`app.ts`):**
- **Store**: PostgreSQL `session` table
- **Secret**: `process.env.SESSION_SECRET || "draxelyra_default_secret"`
- **Cookie Options**: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `maxAge: 30 days`
- **Session Settings**: `resave: false`, `saveUninitialized: false`

## Authentication Routes
Defined in `routes/auth.ts`:
- **POST /login**: Validates credentials, uses `bcrypt.compare`, and sets `req.session.userId` and `req.session.role`.
- **POST /logout**: Requires authentication, calls `req.session.destroy()`.
- **GET /me**: Requires authentication, returns user profile (excluding `passwordHash`).

## Middleware
Access control is enforced via middleware in `middlewares/auth.ts`:
```typescript
// requireAuth: Checks if req.session.userId exists, otherwise returns 401 UNAUTHORIZED
// requireRole(...roles): Checks authentication, then verifies role, returning 403 FORBIDDEN if unauthorized
```

## Role Matrix & Demo Users
DRAXELYRA seeds 6 demo users (password: `demo123`):
1. **System Admin** (Sam SysAdmin, admin@draxelyra.local) - ALL endpoints
2. **Organization Admin** (Olivia OrgAdmin, orgadmin@draxelyra.local) - incidents CRUD, cases review, tasks CRUD
3. **Commander** (Cole Commander, commander@draxelyra.local) - incidents CRUD, cases review, tasks CRUD
4. **Disaster Officer** - incidents CRUD, cases review, tasks CRUD
5. **Manager** (Mary Manager, manager@draxelyra.local) - cases review, tasks CRUD
6. **Analyst** (Alice Analyst, analyst@draxelyra.local) - cases review, case audit
7. **Field Responder** (Frank Field, field@draxelyra.local) - tasks PATCH, case audit (read)
