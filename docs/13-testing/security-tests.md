# Security & Authorization Tests

<span className="badge-implemented">Implemented</span>

Security test suites verify:
- Role boundaries: Field responders cannot access admin demo endpoints.
- Path traversal defenses on file uploads.
- Session cookie `httpOnly` and `secure` flags.
