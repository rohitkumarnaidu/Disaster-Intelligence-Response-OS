# Troubleshooting Runbook

<span className="badge-implemented">Implemented</span>

### Common Operational Issues

1. **Database Connection Refused**:
   - Verify PostgreSQL container is running: `docker compose ps`
   - Check `DATABASE_URL` matches port `5433`.
2. **Session Expired / 401 Unauthorized**:
   - Clear browser cookies and re-authenticate at `/login`.
3. **409 Version Conflict on Case Review**:
   - Another operator modified the case. Refresh the page to load the updated entity version before resubmitting.
