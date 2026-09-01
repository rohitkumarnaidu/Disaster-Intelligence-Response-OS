---
id: architecture-principles
title: Core Architectural Principles
sidebar_label: Architectural Principles
sidebar_position: 2
---

# Core Architectural Principles

<span className="badge-implemented">Implemented</span>

DRAXELYRA's architecture is guided by six foundational principles engineered specifically for life-critical disaster response environments.

---

## 1. Zero-Trust Grounding & Explicit Status
- **Source Code is Authoritative**: Documentation, diagrams, and API contracts must reflect the actual runtime codebase.
- **Explicit Implementation Badges**: Features are explicitly tagged with their operational readiness:
  - <span className="badge-implemented">Implemented</span>: Full production source code present and verified.
  - <span className="badge-live">Real Data Mode</span>: Connected to live external APIs (USGS, GDACS, SACHET).
  - <span className="badge-dev">Development Replay</span>: Historical deterministic scenario dataset for offline training.
  - <span className="badge-mock">Mock Baseline</span>: Synthetic or baseline adapter used when API keys are absent.

---

## 2. Statistical Confidence vs Operational Priority

- **Confidence (K)**: Statistical uncertainty of the computer vision model or sensor reading.
- **Priority Score (P)**: Multi-factor decision matrix incorporating structural damage severity (30%), infrastructure criticality (25%), exposed population density (20%), emergency urgency decay (15%), and model confidence (10%).

---

## 3. Human-in-the-Loop Authority
AI models and external detection feeds generate **candidate signals**, never autonomous operational orders. An authenticated human operator (Duty Officer or Incident Commander) must review the evidence, select an authoritative decision (`CONFIRMED`, `REJECTED`, `UNCERTAIN`), and supply mandatory justification notes before response tasks are dispatched.

---

## 4. Optimistic Concurrency Control (OCC) & Compare-and-Swap (CAS)
In high-stress emergency operations centers, multiple watchstanders frequently inspect the same crisis queues. DRAXELYRA eliminates silent race-condition overwrites using a monotonic `version` column:
```sql
UPDATE cases
SET status = :newStatus, version = :expectedVersion + 1, updated_at = NOW()
WHERE id = :caseId AND version = :expectedVersion;
```
If another operator updated the case concurrently, the query matches zero rows and the API returns HTTP 409 `VERSION_CONFLICT` with the current server record.

---

## 5. Offline-First Field Resilience
Disaster zones frequently experience total cellular and power grid failure. The system treats network unavailability as a normal operating state:
- All static assets and application shells are cached by the Service Worker (`/sw.js`).
- Field observations, ground photos, and task status updates are queued in IndexedDB (`syncQueue`).
- Sequential replay occurs automatically upon connection restoration, handling conflict resolution gracefully.

---

## 6. Immutable Auditability & Cryptographic Provenance
Post-incident after-action reviews require unambiguous legal accountability. Every state transition, triage review, task assignment, and evidence upload is recorded in append-only tables (`audit_events`, `case_status_history`, `ai_decision_logs`) with actor IDs, timestamps, and SHA-256 content hashes.
