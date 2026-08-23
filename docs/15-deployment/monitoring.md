---
id: monitoring
title: Health & Monitoring
sidebar_position: 8
---

# Monitoring & Observability

<span className="badge-implemented">Implemented</span>

- **Healthcheck Probe**: `GET /api/health` returns `{ "status": "healthy" }`.
- **Structured Logs**: Pino logs can be ingested by Datadog, Grafana Loki, or Elasticsearch.
