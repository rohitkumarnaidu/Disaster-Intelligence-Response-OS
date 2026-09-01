---
id: ai-processing
title: AI Inference & Processing Jobs API
sidebar_label: AI & Processing
sidebar_position: 6
---

# AI Inference & Processing Jobs API

<span className="badge-implemented">Implemented</span>

---

### `POST /api/ai/assess`
Executes multimodal damage assessment on an imagery pair.
- **Request Body**: `{ "incidentId": "inc_1", "preImageryId": "img_pre", "postImageryId": "img_post", "criticalAssetId": "asset_1" }`
- **Response**: `200 OK` Conforming to Zod `DamageAssessmentOutputSchema`.

---

### `GET /api/processing/jobs`
Lists background satellite download and change detection jobs.
- **Response**: `200 OK` Array of processing job records with statuses.
