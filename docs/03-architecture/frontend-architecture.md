# Frontend Architecture

<span className="badge-implemented">Implemented</span>

The frontend application located at `artifacts/draxelyra` is built with **React 19**, **Vite 7**, and **Tailwind CSS v4**.

---

## Component & Module Organization

```
artifacts/draxelyra/src/
├── App.tsx                     # Main layout shell, router, and view components
├── main.tsx                    # React DOM root entry point
├── index.css                   # Global tactical dark CSS styles & fonts
├── components/
│   ├── error-boundary.tsx      # React error boundary with retry mechanisms
│   ├── map/
│   │   └── IncidentMap.tsx     # MapLibre GL geospatial map component
│   └── ui/                     # Radix UI primitives & tactical UI widgets
├── hooks/
│   ├── use-mobile.tsx          # Mobile screen breakpoint detection hook
│   └── use-toast.ts            # Toast notification dispatch hook
├── lib/
│   ├── auth.tsx                # AuthProvider context, login/logout, session hook
│   ├── offline-sync.ts         # IndexedDB synchronization queue
│   └── utils.ts                # Tailwind class merge utility (cn)
└── pages/
    ├── login.tsx               # Tactical authentication screen
    └── not-found.tsx           # 404 handler view
```

---

## State Management Architecture

1. **Server State**: Managed via **TanStack React Query** (`@tanstack/react-query`). Query keys are centrally generated via `@workspace/api-client-react`. Automatic background refetching is configured for real-time views (e.g., Command Summary polling at 60s intervals).
2. **Authentication State**: Managed via `AuthProvider` in `lib/auth.tsx`, exposing `useAuth()` with `user`, `loading`, `login()`, and `logout()`.
3. **Offline Mutation State**: Managed via `offline-sync.ts` using native browser **IndexedDB** (`draxelyra-offline` database).
