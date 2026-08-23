# Operational Troubleshooting

<span className="badge-implemented">Implemented</span>

### 1. Database Connection Errors
*Symptom*: `ECONNREFUSED 127.0.0.1:5433`
*Resolution*: Verify Docker Compose is running (`docker compose ps`) and that port 5433 is not occupied.

### 2. Version Conflict (HTTP 409)
*Symptom*: `VERSION_CONFLICT: The record changed on the server.`
*Resolution*: Refresh the case in the UI to load the latest server version and reapply the triage decision.
