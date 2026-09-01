---
id: production-roadmap
title: Strategic Production Roadmap & Future Architecture
sidebar_label: Production Roadmap
sidebar_position: 1
---

# Strategic Production Roadmap & Future Architecture

<span className="badge-planned">Future Strategic Architecture</span>

DRAXELYRA's technical evolution is structured into four upcoming phases:

---

## Phase 1: High-Throughput gRPC Tile Inference Stream
- Transitioning satellite raster tile change detection from REST to **gRPC bidirectional streaming**.
- Sub-second raster chip evaluation with distributed GPU worker nodes.

---

## Phase 2: WebRTC Tactical Drone Video Ingestion
- Ingesting real-time RTSP/WebRTC video streams from emergency reconnaissance drones.
- Frame-by-frame VLM object detection for survivors, vehicles, and active fire perimeters.

---

## Phase 3: Active Learning & Domain LoRA Fine-Tuning
- Continuous automated curation of duty officer confirmations and rejections from `ai_evaluation_dataset`.
- Scheduled LoRA (Low-Rank Adaptation) fine-tuning runs to customize foundation models to regional geography.

---

## Phase 4: Peer-to-Peer Mesh Synchronization
- Enabling field responder mobile devices to synchronize task observations over ad-hoc Bluetooth LE / Wi-Fi Direct mesh networks during complete communications blackout.
