# Input Validation & Sanitization

<span className="badge-implemented">Implemented</span>

- Filenames are sanitized using regex: `.replace(/[^a-z0-9.]/g, '')`.
- All JSON payloads are validated with Zod schemas.
