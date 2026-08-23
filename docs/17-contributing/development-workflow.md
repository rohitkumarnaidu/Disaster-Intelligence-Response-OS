# Development Workflow

<span className="badge-implemented">Implemented</span>

1. OpenAPI-First: Modify `lib/api-spec/openapi.yaml`.
2. Generate types: `pnpm --filter @workspace/api-spec run codegen`.
3. Implement backend route handler and service logic.
4. Build frontend React components and query hooks.
5. Verify tests: `pnpm test`.
