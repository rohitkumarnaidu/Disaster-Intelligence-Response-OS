---
id: configuration
title: Complete System Configuration Reference
sidebar_label: Configuration Matrix
sidebar_position: 2
---

# Complete System Configuration Reference

<span className="badge-implemented">Implemented</span>

All configuration variables supported by DRAXELYRA are documented below.

| Variable Name | Required? | Default Value | Description |
| :--- | :--- | :--- | :--- |
| **`PORT`** | Optional | `3000` | HTTP and WebSocket server listen port. |
| **`NODE_ENV`** | Optional | `development` | Environment mode: `development`, `test`, or `production`. |
| **`DATABASE_URL`** | **Required**| *(None)* | PostgreSQL connection URI (`postgresql://user:pass@host:5432/db`). |
| **`SESSION_SECRET`** | **Required**| `draxelyra_default_secret` | Cryptographic secret for signing session cookies. Must be 64+ hex characters in production. |
| **`GEMINI_API_KEY`** | Optional | *(None)* | Google Gemini AI API key. If absent, falls back to `MockVisionAssessmentProvider`. |
| **`UPLOAD_DIR`** | Optional | `./uploads` | Local filesystem directory for storing uploaded forensic evidence. |
| **`DB_POOL_MAX`** | Optional | `20` | Maximum active PostgreSQL connection pool connections. |
| **`LOG_LEVEL`** | Optional | `info` | Pino structured logging level: `debug`, `info`, `warn`, `error`. |
| **`BASE_URL`** | Optional | `/` | Frontend base URL for reverse proxy hosting. |
