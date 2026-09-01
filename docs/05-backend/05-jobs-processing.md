---
id: jobs-processing
title: Asynchronous Processing Jobs Engine
sidebar_label: Processing Jobs
sidebar_position: 5
---

# Asynchronous Processing Jobs Engine

<span className="badge-implemented">Implemented</span>

Heavy computational operations—including satellite catalog discovery, raster swath download, change detection, and thumbnail generation—are executed asynchronously via the `processing_jobs` table and `JobRunner` service.

---

## Processing Job Lifecycle

```mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> RUNNING : Worker Acquires Job
    RUNNING --> SUCCEEDED : Processing Completed
    RUNNING --> FAILED : Error / Timeout (Attempts < Max)
    FAILED --> QUEUED : Exponential Retry
    RUNNING --> CANCELLED : Operator Aborts Job
    SUCCEEDED --> [*]
```

---

## Job Types

- **`DISCOVERY`**: Queries external STAC APIs (Copernicus CDSE) for available Sentinel passes over an AOI.
- **`DOWNLOAD`**: Fetches optical/SAR products and stages them in local storage.
- **`PREPROCESS`**: Generates ortho-rectified GeoTIFFs and tile pyramids.
- **`CHANGE_DETECTION`**: Executes spectral difference or radar coherence analysis between paired swaths.
- **`THUMBNAIL`**: Extracts visual web preview crops for command center cards.
