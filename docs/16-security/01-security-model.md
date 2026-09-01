---
id: security-model
title: Security Model, Hardening & Threat Defense
sidebar_label: Security Model
sidebar_position: 1
---

# Security Model, Hardening & Threat Defense

<span className="badge-implemented">Implemented</span>

DRAXELYRA implements a defense-in-depth security model engineered for high-consequence crisis response infrastructure.

---

## Core Security Controls

1. **Session Protection**: Signed HTTP-only, `SameSite=Lax`, secure cookies stored in PostgreSQL via `connect-pg-simple`.
2. **Strict RBAC Enforcement**: Role clearance validated at middleware boundary before route execution.
3. **Magic-Byte File Verification**: Uploaded evidence buffers inspected for true binary signatures, rejecting spoofed extensions.
4. **Directory Traversal Defense**: File paths sanitized and verified to reside strictly within the designated storage root.
5. **Prompt Injection Shielding**: External feed text sanitized and wrapped in structured delimiter blocks before passing to Multimodal AI models.
6. **Immutable Audit Trails**: Non-repudiable audit logging for all case status mutations and forensic uploads.
