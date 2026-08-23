# Backend Architecture Overview

<span className="badge-implemented">Implemented</span>

The backend is a Node.js Express application written in TypeScript. It is designed to be stateless (except for session data stored in PG) to allow horizontal scaling.

## Core Pillars
- **Modular Routing**: Routes are grouped by domain (e.g., `casesRouter`, `tasksRouter`).
- **Service Pattern**: Business logic (state machines, scoring) is extracted from route handlers into dedicated services.
- **Unified Error Handling**: All errors funnel through a centralized error-handling middleware to ensure consistent JSON responses.

(See Section 05 for deep dives).\n