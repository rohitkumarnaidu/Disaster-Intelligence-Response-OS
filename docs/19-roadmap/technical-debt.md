# Technical Debt & Known Limitations

1. **Local File Storage**: Current evidence uploads are stored on local disk (`/uploads`); needs abstraction for S3 / Cloud Storage buckets in multi-node clusters.
2. **Synchronous Image Processing**: Image metadata and thumbnail generation run in-process; needs delegation to a background worker queue.
3. **Mock AI Inference**: AI detections currently use the `change-detector/v2.4.1` mock adapter.
