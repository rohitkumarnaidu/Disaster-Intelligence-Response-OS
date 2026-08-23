---
id: environment-management
title: Environment Management
sidebar_position: 6
---

# Environment Configuration

<span className="badge-implemented">Implemented</span>

- Keep distinct `.env.development`, `.env.staging`, and `.env.production` files.
- Store sensitive secrets (`SESSION_SECRET`, `DATABASE_URL`) in secure secret managers (e.g. AWS Secrets Manager, Vault).
