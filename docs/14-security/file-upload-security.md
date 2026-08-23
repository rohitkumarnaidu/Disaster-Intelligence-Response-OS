---
id: file-upload-security
title: Upload Security
sidebar_position: 4
---

# File Upload Security & Magic-Byte Validation

<span className="badge-implemented">Implemented</span>

The upload handler validates real binary header signatures:

```typescript
function checkMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  if (mimetype === 'image/jpeg') return hex.startsWith('FFD8FF');
  if (mimetype === 'image/png') return hex === '89504E47';
  if (mimetype === 'image/webp') {
    return hex === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57454250';
  }
  if (mimetype === 'video/mp4') return buffer.toString('hex', 4, 8).toUpperCase() === '66747970';
  return false;
}
```
