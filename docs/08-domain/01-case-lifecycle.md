---
id: case-lifecycle
title: Case Finite State Machine & Triage Lifecycle
sidebar_label: Case Lifecycle
sidebar_position: 1
---

# Case Finite State Machine & Triage Lifecycle

<span className="badge-implemented">Implemented</span>

The **Case** is the central operational unit of work in DRAXELYRA. Cases progress through a strict 10-state Finite State Machine (FSM) defined in `artifacts/api-server/src/services/case-state-machine.ts`.

```mermaid
stateDiagram-v2
    [*] --> DETECTED : AI / External Sensor Ingestion
    DETECTED --> NEEDS_REVIEW : Automatic Spatial Enrichment
    
    NEEDS_REVIEW --> CONFIRMED : Duty Officer Adjudication
    NEEDS_REVIEW --> REJECTED : False Positive Dismissal
    NEEDS_REVIEW --> UNCERTAIN : Insufficient Telemetry

    CONFIRMED --> PRIORITIZED : 5-Factor Score Calculated
    CONFIRMED --> TASKED : Direct Task Assignment
    PRIORITIZED --> TASKED : Field Units Mobilized

    TASKED --> IN_PROGRESS : Team Deploys On-Site
    IN_PROGRESS --> FIELD_VERIFIED : Ground Truth Observation Uploaded
    IN_PROGRESS --> ACTIONED : Immediate Relief Provided
    
    FIELD_VERIFIED --> ACTIONED : Shoring / Drainage Executed
    ACTIONED --> CLOSED : Commander Signs After-Action
    REJECTED --> CLOSED : Logged to Training Archive
    UNCERTAIN --> CLOSED : Superseded by Drone Pass
    CLOSED --> [*]
```

---

## Formal State Transition Table

| Current State | Allowed Next States | Required Actor Role | Guard Conditions & Actions |
| :--- | :--- | :--- | :--- |
| **`DETECTED`** | `NEEDS_REVIEW` | System / Ingestion | Generated upon ingestion of candidate anomaly; triggers OSM spatial intersection. |
| **`NEEDS_REVIEW`** | `CONFIRMED`, `REJECTED`, `UNCERTAIN` | `Duty Officer`, `Commander` | Mandatory review notes (>= 10 chars); records `reviews` entry. |
| **`CONFIRMED`** | `PRIORITIZED`, `TASKED` | `Duty Officer`, `Commander` | Computes explainable priority score (0 to 100); attaches priority breakdown. |
| **`PRIORITIZED`** | `TASKED` | `Field Lead`, `Commander` | Generates child `tasks` record with dynamic SLA deadline. |
| **`TASKED`** | `IN_PROGRESS` | `Field Lead`, `Responder` | Response team mobilized to target coordinates. |
| **`IN_PROGRESS`** | `FIELD_VERIFIED`, `ACTIONED` | `Field Responder` | Ground observation received with GPS coordinate and photo proof. |
| **`FIELD_VERIFIED`**| `ACTIONED` | `Field Lead` | Mitigation action completed (e.g., pump installed, levee reinforced). |
| **`ACTIONED`** | `CLOSED` | `Incident Commander` | Final outcome recorded in `outcomes` table. |
| **`REJECTED`** | `CLOSED` | `Duty Officer`, `Commander` | False positive logged into `ai_evaluation_dataset` for model tuning. |
| **`UNCERTAIN`** | `CLOSED` | `Duty Officer`, `Commander` | Archived pending higher-resolution reconnaissance. |
| **`CLOSED`** | *(None - Terminal)* | None | Immutable terminal state. |
