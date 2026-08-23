# Production Deployment

<span className="badge-implemented">Implemented</span>

In production:
1. Express API server runs behind an Nginx or Cloudflare reverse proxy with TLS termination.
2. Production builds:
   - Backend: `artifacts/api-server/dist/index.cjs`
   - Frontend: `artifacts/draxelyra/dist/public/`
3. PostgreSQL connection pool configured for high concurrency.
