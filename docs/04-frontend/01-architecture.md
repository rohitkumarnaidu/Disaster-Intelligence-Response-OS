---
id: architecture
title: Frontend Application Architecture & Shell
sidebar_label: Application Architecture
sidebar_position: 1
---

# Frontend Application Architecture & Shell

<span className="badge-implemented">Implemented</span>

The DRAXELYRA frontend application is located in `artifacts/draxelyra/`. It is a modern React 19 Single Page Application configured with Vite 7, Tailwind CSS v4, Wouter routing, and TanStack Query caching.

---

## Application Entry Point

**Source File**: [`artifacts/draxelyra/src/main.tsx`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/main.tsx)

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import './index.css';

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error('Uncaught React UI error:', error, errorInfo);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

---

## Global Provider Hierarchy

**Source File**: [`artifacts/draxelyra/src/App.tsx:2100`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/draxelyra/src/App.tsx#L2100-L2134)

```tsx
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Shell>
                <Router />
              </Shell>
              <Toaster />
            </WouterRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## Shell Component Features (`Shell` in `App.tsx`)

1. **Authentication Guard**: Interrogates `useAuth()`. If `loading`, renders a full-screen loading skeleton. If `!user`, redirects to `/login`.
2. **Real-time Event Listener**: Activates `useLiveEvents()` on mount, establishing WebSocket (`/ws`) connectivity and cache invalidations.
3. **Active Operation Banner**: Displays the active incident ID, severity pulse dot, and start timestamp.
4. **Real Data Mode Indicator**: Highlights live data ingestion status.
5. **Weather Alert Banner**: Fetches active weather warnings from `GET /api/weather/alerts` and displays a dismissible warning bar.
