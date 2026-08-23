# Data Flow

<span className="badge-implemented">Implemented</span>

Data in DRAXELYRA flows through distinct layers, ensuring separation of concerns and data integrity.

## Layers

1. **Presentation Layer**: React components. Fetches data via TanStack Query.
2. **Transport Layer**: RESTful JSON APIs.
3. **Service Layer**: State machines, priority engines, domain logic.
4. **Persistence Layer**: PostgreSQL tables and local file system.

Data flows downwards synchronously in the backend, but asynchronously across the network barrier. Real-time updates (planned) will use WebSocket channels for reverse flow.\n