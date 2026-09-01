---
id: evidence
title: Evidence & Uploads API Specification
sidebar_label: Evidence Endpoints
sidebar_position: 5
---

# Evidence & Uploads API Specification

<span className="badge-implemented">Implemented</span>

Handles forensic photo, video, and drone telemetry uploads.

---

### `POST /api/evidence`
Uploads a forensic media file with magic-byte validation and SHA-256 hashing.
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `file` (binary), `caseId` (string).
- **Limits**: 50MB max file size; JPEG, PNG, WebP, MP4 only.
- **Response**: `201 Created` Evidence metadata record with storage URI and checksum.
