---
id: evidence-audit
title: Evidence Ingestion & Cryptographic Audit Trails
sidebar_label: Evidence & Audit
sidebar_position: 4
---

# Evidence Ingestion & Cryptographic Audit Trails

<span className="badge-implemented">Implemented</span>

Disaster response operations produce sensitive forensic imagery, field verification photos, and life-critical decisions that must withstand rigorous post-incident judicial and after-action scrutiny.

---

## Evidence Upload Security Pipeline

**Source File**: [`artifacts/api-server/src/routes/evidence.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/routes/evidence.ts)

Every file uploaded via `POST /api/evidence` traverses a strict validation sequence:

```mermaid
flowchart TD
    UP[Upload Stream (Multer Memory Storage)] --> SZ{File Size <= 50MB?}
    SZ -->|No| ERR1[HTTP 413 Payload Too Large]
    SZ -->|Yes| MB{Magic Byte MIME Verification}
    
    MB -->|Invalid| ERR2[HTTP 415 Unsupported Media Type]
    MB -->|Valid JPEG / PNG / WebP / MP4| HASH[Calculate SHA-256 Checksum]
    
    HASH --> PATH[Sanitize Path & Disallow Directory Traversal]
    PATH --> DISK[Write File to ./uploads/sha256.ext]
    DISK --> DB[(Insert into evidence Table)]
    DB --> AUDIT[(Insert into audit_events Table)]
```

---

## Magic Byte Signature Verification

File extensions and `Content-Type` headers supplied by browsers are untrusted and easily spoofed. DRAXELYRA inspects raw buffer magic bytes before writing to disk:

| Expected Format | Required Magic Byte Hex Signature |
| :--- | :--- |
| **JPEG** | `FF D8 FF` |
| **PNG** | `89 50 4E 47 0D 0A 1A 0A` |
| **WebP** | `52 49 46 46` (RIFF) + `57 45 42 50` (WEBP) at byte offset 8 |
| **MP4 Video** | `66 74 79 70` (`ftyp`) at byte offset 4 |

---

## Cryptographic Audit Logging

Every state transition, triage adjudication, task modification, and evidence upload automatically inserts an immutable record into `audit_events`:

```typescript
await db.insert(auditEvents).values({
  id: 'aud_' + crypto.randomUUID(),
  actorId: req.session.userId,


  action: 'CASE_REVIEW_SUBMITTED',
  entityType: 'CASE',
  entityId: caseId,
  metadata: {
    decision: 'CONFIRMED',
    previousStatus: 'NEEDS_REVIEW',
    newStatus: 'CONFIRMED',
    priorityScore: 90,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  },
  createdAt: new Date(),
});
```
