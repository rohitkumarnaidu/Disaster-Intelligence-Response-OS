---
id: mock-baseline
title: Baseline Vision Assessment Mock Provider
sidebar_label: Baseline Vision Engine
sidebar_position: 3
---

# Baseline Vision Assessment Mock Provider

<span className="badge-implemented">Implemented</span>

**Source File**: [`artifacts/api-server/src/ai/MockVisionAssessmentProvider.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/ai/MockVisionAssessmentProvider.ts)

When `GEMINI_API_KEY` is not present, DRAXELYRA seamlessly falls back to the deterministic baseline engine `draxelyra-cv-baseline-v2`. It simulates SAR backscatter coherence loss and optical MNDWI (Modified Normalized Difference Water Index) calculations.
