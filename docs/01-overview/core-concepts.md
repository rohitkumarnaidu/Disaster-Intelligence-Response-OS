# Core Concepts

<span className="badge-implemented">Implemented</span>

Understanding DRAXELYRA requires familiarity with its core domain entities, scoring methodologies, and architectural boundaries.

---

## 1. Incidents
An **Incident** represents an active disaster operation bounded in time, geography, and hazard type.
- **Identifier**: e.g., `INC-CHN-01` or `inc-chennai-demo`
- **Area of Interest (AOI)**: GeoJSON Polygon defining the operational theater.
- **Hazard Type**: Categorical identifier (e.g., `Urban flood`, `Earthquake`, `Cyclone`).
- **Severity**: Operational rating (`low`, `medium`, `high`, `critical`).

## 2. Critical Infrastructure Assets
Fixed physical assets whose disruption endangers life safety or operational continuity.
- **Asset Types**: `Hospital`, `Bridge`, `Utility`, `Government`, `School`, `Residential`, `Commercial`.
- **Criticality Score**: Baseline importance metric (e.g., Hospitals = 100, Bridges = 85, Commercial = 30).
- **Population Exposure Tier**: Population vulnerability rating (`High`, `Medium`, `Low`).

## 3. Detections
Machine-generated candidate anomalies extracted from pre- and post-event imagery.
- **Model Metadata**: `modelName` (e.g., `change-detector`), `modelVersion` (e.g., `v2.4.1`), `inferenceTimestamp`.
- **Confidence**: Model statistical confidence score (0.00 to 1.00).
- **Damage Classification**: `No damage`, `Minor`, `Moderate`, `Severe`, `Destroyed`, `Uncertain`.

## 4. Cases
A **Case** is the central operational unit in DRAXELYRA. It couples an AI Detection with a specific Critical Asset and Incident.
- **Review State**: `PENDING`, `CONFIRMED`, `REJECTED`, `UNCERTAIN`.
- **Status Lifecycle**: `DETECTED -> NEEDS_REVIEW -> CONFIRMED -> PRIORITIZED -> TASKED -> IN_PROGRESS -> FIELD_VERIFIED -> ACTIONED -> CLOSED`.
- **Optimistic Concurrency Version**: Integer incremented on every mutation to prevent conflicting triage decisions.

## 5. Explainable Priority
A computed integer score (0–100) reflecting operational urgency. Unlike raw ML confidence, Priority incorporates structural damage, facility criticality, exposed population, and time decay.

## 6. Response Tasks
Discrete operational orders assigned to response teams (e.g., Public Works, Field Verification Cell) to validate or remediate a confirmed case.

## 7. Field Observations & Evidence
Ground-truth photos, sensor telemetry, and inspection notes uploaded by tactical personnel. Every artifact undergoes SHA-256 hashing and magic-byte inspection.

## 8. Audit Events
An immutable log of every status transition, review decision, task assignment, and upload, preserving an accountable record for post-incident review.
