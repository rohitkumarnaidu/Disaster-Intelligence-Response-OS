---
id: testing-strategy
title: Testing Strategy & Automated Quality Gates
sidebar_label: Testing Strategy
sidebar_position: 1
---

# Testing Strategy & Automated Quality Gates

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces rigorous automated testing covering unit formulas, state machine transitions, concurrent race conditions, API contracts, and end-to-end browser flows.

```mermaid
flowchart TD
    UNIT["Unit Tests (Vitest)<br/>Priority Formula, Geo Utils, Zod Schemas"]
    OCC["Concurrency Tests (Vitest & Supertest)<br/>10 Concurrent CAS Updates (1 Winner, 9 HTTP 409s)"]
    INT["API Integration Tests (Supertest)<br/>Auth, RBAC Guards, State Machines, Outbox"]
    E2E["E2E Tests (Playwright)<br/>Login, Map Navigation, Triage Adjudication, Offline Sync"]
    DOCS["Docs Build Validation<br/>Docusaurus zero broken links check"]

    UNIT --> OCC --> INT --> E2E --> DOCS
```

---

## Test Execution Commands

```bash
# Run unit tests across all workspace packages
pnpm run test

# Run API integration tests against isolated PostgreSQL test container
pnpm --filter @workspace/api-server run test

# Run Vitest in watch mode during active development
pnpm --filter @workspace/api-server run test:watch

# Execute Playwright end-to-end test suite
pnpm run test:e2e

# Validate documentation compilation and link integrity
pnpm run docs:build
```
