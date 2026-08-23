# Security & Pen-Testing Suites

<span className="badge-implemented">Implemented</span>

Security test suites verify:
- Unauthenticated requests to protected endpoints return `401`.
- Role escalation attempts return `403`.
- File uploads with fake extensions and invalid magic bytes return `400`.
- Path traversal sequences (e.g. `../../etc/passwd`) in upload filenames are sanitized.
