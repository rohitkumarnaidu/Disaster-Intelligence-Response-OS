# AI / ML Architecture

<span className="badge-mock">Mock Adapter Active</span> <span className="badge-planned">Live Service Planned</span>

DRAXELYRA decouples **AI inference generation** from **operational emergency triage**.

---

## Dual-Score Intelligence Model

1. **Statistical Confidence (0.0 to 1.0)**: Probability that the sensor detected actual physical change.
2. **Operational Priority (0 to 100)**: Operational urgency of dispatching human response personnel.

```mermaid
graph LR
    A[Pre/Post Satellite Imagery] --> B[Change Detector Model v2.4.1]
    B -->|Confidence: 0.55| C[Candidate Signal]
    D[Critical Hospital GIS Layer] --> E[Criticality: 100]
    F[Census Vulnerability Data] --> G[Exposure: High / 90]
    H[Incident Declared: 28.8h ago] --> I[Urgency: 12]

    C & E & G & I --> J[Deterministic Priority Engine]
    J -->|Priority Score: 83| K[High-Priority Queue C-1048]
```
