# Production Deployment Architecture

<span className="badge-implemented">Implemented</span>

In a production environment:
1. **Reverse Proxy (Nginx / Cloudflare)**: Terminates TLS, serves static frontend assets from `artifacts/draxelyra/dist`, and proxies `/api` requests to Node.js on port 5000.
2. **Database Cluster**: Managed PostgreSQL with automated backups and read-replicas.
3. **Persistent Volume**: Dedicated storage volume mounted at `/uploads` for evidence artifacts.
