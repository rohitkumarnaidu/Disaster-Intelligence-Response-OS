---
id: evidence
title: Evidence API
sidebar_position: 6
---

# Evidence API Reference

### `POST /api/evidence/upload`
Upload a binary media artifact with cryptographic and signature verification.
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `caseId`, `type` (`photo` / `sensor`), `source`, `file`
- **Response (200)**:
```json
{
  "success": true,
  "evidence": {
    "id": "ev-174000...",
    "caseId": "C-1048",
    "uri": "/uploads/ev-174000-a1b2c3d4.jpg",
    "mimeType": "image/jpeg",
    "size": 421050,
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```
