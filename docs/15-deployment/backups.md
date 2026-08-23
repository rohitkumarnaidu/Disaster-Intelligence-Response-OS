# Backup Strategies

<span className="badge-implemented">Implemented</span>

- **Daily Automated pg_dump**:
  ```bash
  pg_dump -Fc -d draxelyra > /backups/draxelyra-$(date +%F).dump
  ```
- **Evidence Storage Mirroring**: Sync `/uploads` directory to secondary geographic bucket storage.
