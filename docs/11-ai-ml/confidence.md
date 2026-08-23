---
id: confidence
title: Model Confidence
sidebar_position: 6
---

# Statistical Confidence vs Calibration

<span className="badge-implemented">Implemented</span>

- Model confidence reflects the raw detection probability (0.00–1.00).
- In DRAXELYRA, model confidence contributes **10%** of the final priority score, ensuring low-confidence detections on vital assets (e.g. 55% confidence on a hospital) are not silently ignored.
