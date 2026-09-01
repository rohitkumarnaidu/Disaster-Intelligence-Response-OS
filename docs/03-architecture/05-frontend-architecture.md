---
id: frontend-architecture
title: Frontend Architecture & Provider Tree
sidebar_label: Frontend Architecture
sidebar_position: 5
---

# Frontend Architecture & Provider Tree

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend is a high-performance Single Page Application (SPA) built with React 19, Vite 7, Tailwind CSS v4, Wouter routing, and TanStack Query v5.

```mermaid
flowchart TD
    subgraph Bootstrap["Application Bootstrap (main.tsx)"]
        ROOT[createRoot #root]
        ERR_ROOT[ErrorBoundary]
        APP[App Component]
        SW[Service Worker Registration /sw.js]
    end

    subgraph Providers["Provider Hierarchy (App.tsx)"]
        P1[QueryClientProvider client=queryClient]
        P2[TooltipProvider]
        P3[AuthProvider /api/auth/me]
        P4[WouterRouter base=BASE_URL]
        SHELL[Shell Layout Component]
        ROUTER[Wouter Switch Router]
        TOAST[Toaster & AlertBanner]
    end

    subgraph ShellComp["Shell Layout (App.tsx:174)"]
        SIDEBAR[Sidebar Navigation]
        HEADER[Operational Header & Incident Switcher]
        INDICATOR[LiveFeedIndicator SSE/WS]
        BANNER[Active Weather Alerts Banner]
        MAIN[Main Tactical Content Outlet]
    end

    ROOT --> ERR_ROOT --> APP
    APP --> P1 --> P2 --> P3 --> P4 --> SHELL
    SHELL --> SIDEBAR & HEADER & BANNER & MAIN
    HEADER --> INDICATOR
    MAIN --> ROUTER
    APP --> TOAST
    ROOT --> SW
```

---

## Component & State Architecture

### 1. Provider Tree Ordering
1. **`QueryClientProvider`**: Configures TanStack Query server caching with standardized query keys.
2. **`TooltipProvider`**: Radix UI tooltip context for accessible operational hints.
3. **`AuthProvider`**: Deserializes session user via `GET /api/auth/me`. Enforces login redirection on 401.
4. **`WouterRouter`**: Lightweight client-side router matching 15 discrete application routes.
5. **`<Shell>`**: Enforces authentication guards, renders responsive sidebar/topbar navigation, and listens to real-time events via `useLiveEvents()`.

### 2. Styling System
- **Tailwind CSS v4**: Modular utility-first design utilizing CSS variables for theme tokens (e.g., `bg-sidebar`, `border-border`, `text-primary`).
- **Tactical Dark Palette**: High-contrast, dark-mode optimized colors designed for low-fatigue 24/7 EOC operations.
