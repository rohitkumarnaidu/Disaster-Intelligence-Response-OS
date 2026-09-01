---
id: ai-decision-logging
title: AI Decision Logging & SHA-256 Caching
sidebar_label: Decision Logging & Cache
sidebar_position: 6
---

# AI Decision Logging & SHA-256 Caching

<span className="badge-implemented">Implemented</span>

Every AI inference invocation records an immutable entry in `ai_decision_logs` capturing the prompt version, model name, input SHA-256 hash, raw JSON response, token counts, and execution latency.
