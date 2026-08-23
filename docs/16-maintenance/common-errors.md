# Common Operational Errors

| Error | Cause | Resolution |
| :--- | :--- | :--- |
| `401 UNAUTHORIZED` | Session expired or missing | Re-authenticate via `/login`. |
| `403 FORBIDDEN` | Insufficient user role | Check permissions matrix or login with appropriate role. |
| `400 Invalid file signature` | Binary magic bytes mismatch | Upload authentic JPEG, PNG, WebP, or MP4 files. |
