# Retry Strategy & Exponential Backoff

<span className="badge-implemented">Implemented</span>

- **Immediate Reconnection**: Triggers on `window.addEventListener('online')`.
- **Transient Failures (5xx / Timeout)**: Retries with exponential backoff (1s, 2s, 4s, 8s intervals).
- **Permanent Client Errors (4xx)**: Logged and quarantined to prevent blocking subsequent queue items.
