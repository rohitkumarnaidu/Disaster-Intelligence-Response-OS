# Demo & Scenario Replay API

<span className="badge-dev">Development Replay</span>

### `POST /api/demo/load`
- **Description**: Idempotently seeds the Chennai Urban Flood dataset (`inc-chennai-demo`), critical facilities, candidate detections, and the hero case (`C-1048`).
- **Access**: `system_admin`.

### `POST /api/demo/reset`
- **Description**: Wipes active demo telemetry and restores initial seed state.
