# Adding Features: The OpenAPI-First Guide

1. Update `lib/api-spec/openapi.yaml`.
2. Run `pnpm --filter @workspace/api-spec run codegen`.
3. Implement backend route in `artifacts/api-server/src/routes/`.
4. Connect frontend view using generated React Query hooks.
5. Add unit and integration tests.
