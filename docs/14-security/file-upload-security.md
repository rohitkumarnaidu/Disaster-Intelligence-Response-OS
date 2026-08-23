# File Upload Security & Magic Bytes

<span className="badge-implemented">Implemented</span>

- **Magic Byte Signatures**: Leading bytes inspected before saving:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `RIFF....WEBP`
  - MP4: `ftyp`
- **SHA-256 Hashing**: Computed for every upload to maintain chain of custody.
- **Path Traversal Prevention**: Filenames sanitized with GUID identifiers.
