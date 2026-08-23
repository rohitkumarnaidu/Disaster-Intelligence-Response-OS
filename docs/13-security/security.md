# Security Architecture
<span className="badge-implemented">Implemented</span>

The platform handles highly sensitive tactical data and enforces strict access controls and data validation.

## Session Management

- **Provider:** HTTP-Only Cookies managed via `connect-pg-simple` (PostgreSQL session store).
- **Hardening:** `secure` flag enforced in production; sessions hard-expire after a 30-day `maxAge`.
- **Passwords:** Bcrypt is used for all password hashing. Raw passwords are never stored or logged.

## Role-Based Access Control (RBAC)

Access is gatekept by dual middleware functions:
1. `requireAuth`: Verifies the presence and integrity of the session cookie.
2. `requireRole(roles[])`: Asserts that the authenticated user's assigned role is within the permitted array.

```typescript
// Example from tasks router
router.post('/', requireRole(['System Admin', 'Commander', 'Response Coordinator']), createTask);
```

## File Upload Security

Field responders frequently upload imagery from untrusted environments. The upload pipeline (`/api/evidence/upload`) enforces:

1. **MIME Whitelist:** Only images and short videos are accepted.
2. **Magic Bytes Validation:** Files are deeply inspected to ensure headers match the extension:
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47`
   - WEBP: `RIFF` ... `WEBP`
   - MP4: `ftyp`
3. **Size Constraints:** Hard limit of 50MB per payload.
4. **Integrity:** SHA-256 checksums are generated and stored upon disk write.
5. **Path Traversal:** File names are sanitized and generated server-side to prevent directory traversal exploits.

## Observability & Redaction

**Source File:** `backend/src/utils/logger.ts`

The platform uses Pino for high-performance structured logging. To prevent credentials and session hijacking tokens from leaking into external aggregation services, the logger is configured with strict redaction paths:

```typescript
const logger = pino({
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'body.password'
  ]
});
```

## Audit Trail

The database schema includes an `audit_events` table. This table is strictly append-only. Backend state machine transitions automatically generate localized context events, guaranteeing an unalterable operational history for post-disaster reviews.
