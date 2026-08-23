# Frontend Architecture

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend is a React 18 Single Page Application designed for high-stress disaster response environments. The architecture prioritizes performance, offline capability, and rapid data access.

## Entry Point

**Source:** `artifacts/draxelyra/src/main.tsx`

The application bootstrap sequence:
1. Creates the React 18 root via `createRoot(document.getElementById('root')!, { onCaughtError: ... })`
2. Mounts the root component tree: `<ErrorBoundary><App /></ErrorBoundary>`
3. Registers the Service Worker: Checks `'serviceWorker' in navigator`, and on window load registers `/sw.js` to enable PWA features.
4. Imports `./index.css` which loads Tailwind and global CSS variables.

## Provider Hierarchy

The `App.tsx` file establishes the global context providers, wrapping the application in the following order:

```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell>
          <Router /> {/* Wouter Switch wrapped in RoutedErrorBoundary */}
        </Shell>
        <Toaster />
      </WouterRouter>
    </AuthProvider>
  </TooltipProvider>
</QueryClientProvider>
```

1. **`QueryClientProvider`**: Configures TanStack Query for server state caching.
2. **`TooltipProvider`**: Radix UI provider for accessible tooltips globally.
3. **`AuthProvider`**: Custom context for session management.
4. **`WouterRouter`**: Minimalist routing context.
5. **`<Shell>`**: The main layout component providing the sidebar, topbar, and acting as an auth guard.
6. **`<Toaster />`**: Global notification system.

## Authentication Flow

**Source:** `src/lib/auth.tsx`

Authentication is strictly enforced before accessing the application shell.

- **Initialization**: On mount, `AuthProvider` calls `customFetch<User>('/api/auth/me')`. 
  - If successful, sets the user in state.
  - If error (e.g., 401), sets user to null.
  - Sets `loading = false` to unblock the UI.
- **Login (`login(data)`)**: POSTs to `/api/auth/login`. On success, updates context and navigates to `/`.
- **Logout (`logout()`)**: POSTs to `/api/auth/logout`. Clears context and navigates to `/login`.
- **Guard**: The `<Shell>` component checks the auth state:
  - If `loading`, renders a full-screen spinner.
  - If `!user`, redirects immediately to `/login`.

## Route Definitions

All 15 routes are defined within the Wouter `<Switch>` inside `App.tsx`.

| Route | Component | Auth Required | Purpose | TanStack Query Hook | Mutations |
|-------|-----------|---------------|---------|---------------------|-----------|
| `/` | `CommandCenter` | Yes | Dashboard: 6 KPI metrics, minimap, top 4 cases, owned tasks, activity feed | `useGetCommandSummary` (refetch: 60s) | None |
| `/login` | `Login` | No | Email/password form, pre-filled demo credentials | None | `login()` (Auth) |
| `/incidents` | `Incidents` | Yes | Registry of crisis incidents | `useListIncidents` | None |
| `/incidents/:id`| `IncidentDetail` | Yes | Single incident: metadata, timeline, AOI minimap | `useGetIncident(id)` | None |
| `/assessment` | `Assessment` | Yes | Map-first triage workspace with layer toggles | `useListCases` | None |
| `/cases` | `Cases` | Yes | Priority queue table sorted by score/confidence | `useListCases` | None |
| `/cases/:id` | `CaseDetail` | Yes | Deep case view: before/after imagery, priority ledger, response card | `useGetCase(id)` | None |
| `/review/:id` | `Review` | Yes | Human-in-the-loop adjudication: confirm/reject/uncertain | `useGetCase(id)` | `useReviewCase()` |
| `/tasks` | `Tasks` | Yes | Kanban board: queued/in_progress/completed columns | `useListTasks` | `useUpdateTask()` |
| `/tasks/:id` | `TaskDetail` | Yes | Task inspection: assignment, SLA, verification checklist | None (fallback) | `useUpdateTask()` |
| `/field` | `Field` | Yes | Mobile field verification with offline sync UI | None (static) | None (local state)|
| `/analytics` | `Analytics` | Yes | KPIs, funnel chart, confidence vs priority scatter, SLA by team | None (static) | None |
| `/demo` | `Demo` | Yes | Scenario replay engine with 5-step progress | None | `useLoadDemo()`, `useResetDemo()` |
| `/settings` | `Settings` | Yes | Demo user directory, integration adapter toggles | None | None |
| `*` | `NotFound` | No | 404 page | None | None |

## TanStack Query Patterns

- **Query Keys**: Standardized as `['entity', id?]`. Example: `['incident-map', incidentId]`.
- **Refetching**: Highly dynamic data (like the `CommandCenter` summary) utilizes `refetchInterval` (60000ms).
- **Invalidation**: Mutations immediately invalidate related query keys. For instance, `useReviewCase()` invalidates `['incident-map']` to trigger a map refresh, showing the new case status color.\n