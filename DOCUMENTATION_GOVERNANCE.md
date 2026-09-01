# DRAXELYRA Documentation Governance & Maintenance SOP

## 1. Zero-Trust Documentation Principles

1. **Source Code is Ground Truth**: Documentation must never describe speculative, aspirational, or unverified features as implemented. If code and documentation disagree, source code wins.
2. **Status Badging Requirement**: Every technical documentation page MUST include a status badge (adge-implemented, adge-partial, adge-dev, or adge-planned).
3. **Explicit File Line Linking**: Every service, model, algorithm, and schema documented must cite its exact repository source file path with line numbers.
4. **Level 4 Technical Depth**: Prohibit shallow 1-paragraph summaries. Every feature page must provide architecture diagrams, parameter matrices, DB tables, API schemas, and troubleshooting steps.

---

## 2. Pull Request Documentation Verification Checklist

Every pull request that modifies schemas, API endpoints, domain state machines, or external feeds must pass the following verification gates before merging:

- [ ] **Schema Changes**: If tables in lib/db/src/schema/ are modified, update docs/database/schema.md and docs/database/er-diagram.md.
- [ ] **State Machine Changes**: If state transitions in case-state-machine.ts or 	ask-state-machine.ts change, update Mermaid diagrams in docs/domain/case-lifecycle.md and docs/domain/task-lifecycle.md.
- [ ] **API Endpoint Changes**: If routes in rtifacts/api-server/src/routes/ are added or updated, add the endpoint to docs/api/ with request/response payloads and error envelopes.
- [ ] **External Feed Ingestion**: If ingestion parsers in ingestion-engine.ts are updated, update docs/data-integrations/.
- [ ] **Zero Broken Links**: Run pnpm run docs:build and verify 100% clean compilation with zero broken links or MDX errors.

---

## 3. Automated Documentation Build Commands

`ash
# Regenerate all documentation files from generator suite
node scripts/docs-data/index.mjs

# Build and validate Docusaurus static site with zero broken links
pnpm run docs:build

# Test local documentation preview server on port 3000
pnpm run docs:serve
`