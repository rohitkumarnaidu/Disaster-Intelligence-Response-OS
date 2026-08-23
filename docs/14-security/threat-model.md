# Threat Model & Mitigation

| Threat Vector | Potential Impact | Mitigation |
| :--- | :--- | :--- |
| **Session Hijacking** | Unauthorized triage commands | `httpOnly`, `SameSite=Lax`, `secure` cookie flags |
| **Concurrent Edit Collision** | Stale data overwriting live field updates | Optimistic Concurrency Control with atomic CAS |
| **Malicious File Upload** | Remote code execution via upload | Magic-byte header inspection and random GUID naming |
| **Unauthorized Action** | Tactical personnel altering incident parameters | Strict RBAC middleware on all non-read routes |
