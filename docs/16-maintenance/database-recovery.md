---
id: database-recovery
title: Database Recovery
sidebar_position: 6
---

# Database Recovery Runbook

```bash
# Restore PostgreSQL dump
pg_restore -d draxelyra --clean /backups/draxelyra-backup.dump
```
