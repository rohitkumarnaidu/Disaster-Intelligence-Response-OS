# Frontend Overview

<span className="badge-implemented">Implemented</span>

The DRAXELYRA web console (`artifacts/draxelyra`) provides a high-density, low-latency tactical workspace tailored for emergency operations centers and mobile field units.

---

## Key Modules

- **Navigation Shell**: Fixed top header with active counters (backlog, overdue tasks, active incidents) and user session menu.
- **Geospatial Canvas**: Hardware-accelerated MapLibre GL map supporting GeoJSON layers for incident boundaries, critical assets, and detections.
- **Evidence Review Studio**: Dual-pane pre/post satellite imagery inspector with damage classification and review rationale forms.
- **Offline Mutation Queue**: Client-side IndexedDB database buffering requests during cellular outages.
