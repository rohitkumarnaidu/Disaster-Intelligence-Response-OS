# Database Deployment & Tuning

<span className="badge-implemented">Implemented</span>

- Recommended connection pooling: `max: 20`, `idleTimeoutMillis: 30000`.
- SSL connection required in production: `DATABASE_URL=postgres://user:pass@host:5432/draxelyra?sslmode=require`.
