---
id: architecture-principles
title: Architectural Principles
sidebar_position: 2
---

# Architectural Principles

The engineering of DRAXELYRA is governed by five foundational architectural principles:

### 1. Explainability Over Black-Box Automation
AI model inferences must never dictate operational actions without human interpretability. Priority scores are calculated deterministically using weighted operational factors (`0.30*S + 0.25*C + 0.20*E + 0.15*U + 0.10*Conf`) so duty officers can inspect exactly why an asset was ranked high.

### 2. Strict Human-in-the-Loop Triage
An AI detection is merely a *candidate signal*. It cannot transition to an assigned field task without explicit confirmation (`CONFIRMED`, `REJECTED`, or `UNCERTAIN`) by an authorized analyst or commander with recorded review notes.

### 3. Resilient Offline Operation
Field responders in disaster zones cannot rely on uninterrupted high-speed data. The system treats network disconnection as a standard operating state: all field observations and task updates are buffered in browser IndexedDB storage and synchronized sequentially upon reconnection.

### 4. Zero-Data-Loss Concurrency
Disaster command centers involve multiple duty officers, triage analysts, and field liaisons acting concurrently. The system employs **Optimistic Concurrency Control (OCC)** using version fields and compare-and-swap SQL updates, preventing accidental state overwrites.

### 5. Immutable Auditability
Every review decision, task status change, priority recalculation, and field upload creates an append-only `audit_events` record linked to the acting user, timestamp, and metadata.
