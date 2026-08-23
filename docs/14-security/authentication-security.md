---
id: authentication-security
title: Authentication Security
sidebar_position: 2
---

# Authentication Security

<span className="badge-implemented">Implemented</span>

- **Password Hashing**: Bcrypt with 10 salt rounds.
- **Session Tokens**: Cryptographically random session identifiers signed via HMAC-SHA256.
- **Cookie Flags**: `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
