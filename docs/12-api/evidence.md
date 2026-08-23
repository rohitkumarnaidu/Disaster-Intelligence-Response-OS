# Evidence API

<span className="badge-implemented">Implemented</span>

### `POST /api/evidence/upload`
- **Description**: Ingests ground-truth photos and tactical attachments.
- **Content-Type**: `multipart/form-data`
- **Validation Pipeline**:
  1. Size limit: Maximum 50 MB.
  2. MIME type whitelist: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`.
  3. Binary magic-byte header inspection.
  4. Computes SHA-256 checksum.
  5. Stores file to `uploads/` with randomized GUID filename.
