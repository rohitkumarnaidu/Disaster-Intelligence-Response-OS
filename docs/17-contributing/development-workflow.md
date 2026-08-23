# Developer Workflow

1. Fork & clone the repository.
2. Create a feature branch: `git checkout -b feat/satellite-pipeline`.
3. If changing API routes, update `lib/api-spec/openapi.yaml` first.
4. Run `pnpm --filter @workspace/api-spec run codegen`.
5. Run full checks: `pnpm run typecheck && pnpm run test`.
