# State Management

<span className="badge-implemented">Implemented</span>

DRAXELYRA utilizes a 3-tier state architecture:

1. **Server State**: Managed via **TanStack React Query** (`@tanstack/react-query`).
   - Query keys are strictly typed via `@workspace/api-client-react`.
   - Polling intervals: 60s for summary dashboards, instant refetch on window focus.
2. **Authentication State**: Managed via React Context in `artifacts/draxelyra/src/lib/auth.tsx`, exposing:
   - `user`: Current logged-in user object (`id`, `name`, `email`, `role`).
   - `login(email, password)`: Mutates session cookie.
   - `logout()`: Clears session and redirects to `/login`.
3. **Offline Queue State**: Managed via **IndexedDB** in `artifacts/draxelyra/src/lib/offline-sync.ts`.
