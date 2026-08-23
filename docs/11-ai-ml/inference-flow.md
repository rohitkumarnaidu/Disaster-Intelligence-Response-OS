# Inference Flow & Triage Pipeline

<span className="badge-implemented">Implemented</span>

```mermaid
flowchart LR
    A[Pre/Post GeoTIFFs] --> B[Inference Service]
    B --> C[Candidate Detections]
    C --> D[Critical Asset Spatial Join]
    D --> E[Priority Calculation]
    E --> F[Human Analyst Review]
```
