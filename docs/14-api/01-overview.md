---
id: overview
title: REST API Architecture & Standards
sidebar_label: API Overview
sidebar_position: 1
---

# REST API Architecture & Standards

<span className="badge-implemented">Implemented</span>

The DRAXELYRA API is a type-safe RESTful interface mounted at `/api` on port `3000`. It enforces JSON error envelopes, Zod input validation, session cookie authentication, and Optimistic Concurrency Control.

---

## Global Request & Response Conventions

- **Base URL**: `http://localhost:3000/api` (or `https://response-os.agency.gov/api`)
- **Transport**: HTTPS (HTTP/2 in production reverse proxy).
- **Authentication**: Signed HTTP-only cookie `connect.sid` sent automatically with requests (`credentials: 'include'`).
- **Content Type**: `application/json` for mutations; `multipart/form-data` for evidence uploads.
- **Error Format**:
  ```json
  {
    "error": {
      "code": "VERSION_CONFLICT",
      "message": "The record changed on the server.",
      "serverVersion": 3,
      "serverRecord": { "id": "C-1048", "status": "CONFIRMED", "version": 3 }
    }
  }
  ```
