---
id: coding-standards
title: Engineering Standards & Code Governance
sidebar_label: Coding Standards
sidebar_position: 2
---

# Engineering Standards & Code Governance

<span className="badge-implemented">Implemented</span>

1. **Strict TypeScript**: No `any` types in domain entities or route handlers. All API request/response payloads must have corresponding Zod validation schemas.
2. **ACID Transaction Boundaries**: Any state transition involving multiple table updates must execute within `db.transaction(async (tx) => ...)`.
3. **Mandatory OCC Version Checks**: Mutable entity tables must include a `version` column and check `version = expectedVersion` on every update.
4. **Zero-Trust Documentation Rule**: Codebase implementation is the sole source of truth. Features must be explicitly badged (<span className="badge-implemented">Implemented</span>, <span className="badge-live">Real Data Mode</span>, <span className="badge-mock">Mock Baseline</span>).
