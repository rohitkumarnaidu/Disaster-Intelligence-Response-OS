# AI Architecture

<span className="badge-planned">Planned</span>

The AI architecture will process incoming data streams (satellite imagery, drones, field reports) to automatically detect anomalies and generate draft Cases.

## Components
- **Ingestion Pipeline**: Normalizes multimodal data.
- **Inference Engine**: Runs object detection and damage assessment models.
- **Prioritization Engine**: (Currently implemented via heuristics) will be enhanced with ML-based triage models.\n