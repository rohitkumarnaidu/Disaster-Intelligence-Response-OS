# Frontend Architecture Overview

<span className="badge-implemented">Implemented</span>

The frontend architecture emphasizes modularity and fast iteration. We use React 18 with Vite for lightning-fast HMR and building.

## Core Pillars
- **State Management**: TanStack Query for server state. Local state is kept close to components using React `useState` or `useReducer`.
- **Routing**: `wouter` for minimalistic, fast routing without the bloat of larger routers.
- **Styling**: Tailwind CSS combined with Radix UI primitives for accessible, unstyled components.

(See Section 04 for deep dives).\n