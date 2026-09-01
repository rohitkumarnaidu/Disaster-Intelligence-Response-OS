---
id: runbooks
title: Operational Runbooks & Maintenance Procedures
sidebar_label: Operational Runbooks
sidebar_position: 1
---

# Operational Runbooks & Maintenance Procedures

<span className="badge-implemented">Implemented</span>

This runbook provides emergency operations center sysadmins and DevOps engineers with standard operating procedures (SOPs) for routine maintenance, database backup/recovery, and incident remediation.

---

## 1. Database Backup & Point-in-Time Recovery

### Automated Full Dump
```bash
# Create timestamped compressed PostgreSQL backup
docker exec -t draxelyra-postgres pg_dump -U postgres -d draxelyra -F c -b -v -f /var/lib/postgresql/data/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore Procedure
```bash
# Restore from archive into target database
docker exec -i draxelyra-postgres pg_restore -U postgres -d draxelyra --clean --if-exists -v /var/lib/postgresql/data/backup_20240526.dump
```

---

## 2. Session Table Pruning
Expired session records stored via `connect-pg-simple` can be cleaned up manually if the automated cleaner is paused:

```sql
DELETE FROM session WHERE expire < NOW();
```

---

## 3. Clearing Stuck Processing Jobs
If an asynchronous satellite download or change-detection job hangs due to an external network timeout:

```sql
UPDATE processing_jobs
SET status = 'FAILED',
    error_message = 'Manually timed out by operator after 30 minutes',
    updated_at = NOW()
WHERE status = 'RUNNING' AND updated_at < NOW() - INTERVAL '30 minutes';
```
