---
id: demo
title: Demo Replay API
sidebar_position: 10
---

# Demo Replay API Reference

<span className="badge-dev">Development Replay</span>

### `POST /api/demo/load`
Idempotently clears and re-seeds the deterministic Chennai Urban Flood scenario (`inc-chennai-demo`), seeded user accounts, and hero case `C-1048`.
- **Permissions**: System Admin, Organization Admin

### `POST /api/demo/reset`
Alias to `/api/demo/load` returning a 307 redirect.
