---
id: troubleshooting
title: Production Troubleshooting & Error Remediation
sidebar_label: Troubleshooting Guide
sidebar_position: 2
---

# Production Troubleshooting & Error Remediation

<span className="badge-implemented">Implemented</span>

---

## Common Incident Failure Modes

### 1. HTTP 409 `VERSION_CONFLICT` Storms
- **Symptom**: Multiple operators report being unable to save reviews on high-priority cases.
- **Root Cause**: Two or more watchstanders are attempting to review the same incident simultaneously without refreshing their local client state.
- **Remediation**: Advise operators to click the amber "Load Latest Server State" toast alert. The UI will merge non-conflicting fields and update the `expectedVersion`.

---

### 2. MapLibre WebGL Context Loss
- **Symptom**: The tactical map canvas goes black or displays `WebGL context lost` in browser console.
- **Root Cause**: GPU memory exhaustion when loading large Sentinel-2 raster layers on integrated laptop GPUs.
- **Remediation**: The map error boundary automatically catches the failure and switches to low-overhead vector tile mode. If persistent, toggle off the High-Density Satellite Raster layer in Map Settings.

---

### 3. OpenStreetMap Overpass API 429 Rate Limiting
- **Symptom**: Automated critical asset extraction fails with HTTP 429 `Too Many Requests`.
- **Root Cause**: Main Overpass server (`overpass-api.de`) is experiencing heavy global community load.
- **Remediation**: `osm-sync.ts` automatically retries against secondary community mirrors (`kumi.systems`, `private.overpass-api.de`) with exponential backoff (2s, 4s, 8s).

---

### 4. Multimodal AI API Quota Exhaustion
- **Symptom**: Case creation continues, but AI damage reasoning fields display baseline synthetic metrics.
- **Root Cause**: `GEMINI_API_KEY` hit rate limits (15 RPM on free tier or billing threshold).
- **Remediation**: The system automatically degrades gracefully to `MockVisionAssessmentProvider` (`draxelyra-cv-baseline-v2`), logging the incident to `ai_decision_logs` without crashing the triage pipeline.
