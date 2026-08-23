# Database Provisioning & High Availability

<span className="badge-implemented">Implemented</span>

Production database checklist:
- Enable SSL/TLS connections (`sslmode=require`).
- Automated daily pg_dump backups.
- Connection limits tuned for container resources.
