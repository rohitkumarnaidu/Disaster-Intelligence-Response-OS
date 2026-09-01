# DRAXELYRA — FINAL STATIC VS DYNAMIC DATA AUDIT
**Disaster Intelligence & Response OS**
*Certified: 2026-09-01 | Data Freshness Governance & Anti-Slop Enforcement*

---

## 1. Zero-Fabrication Freshness Governance
A core failure mode of disaster response systems is falsely labeling asynchronous, cached, or orbital pass data as "LIVE". DRAXELYRA strictly enforces explicit data classification across all endpoints, UI badges, and API contracts.

---

## 2. Standardized Freshness Classification Enum

```typescript
export type FreshnessClass =
  | "LIVE"                  // Active socket or continuous sub-second stream
  | "NEAR_REAL_TIME"        // Telemetry polled or ingested within 5-15 minutes
  | "ACQUISITION_DEPENDENT" // Satellite revisit orbit (e.g. Sentinel-1/2 pass every 3-5 days)
  | "PERIODIC"              // Updated daily or weekly (e.g. OpenStreetMap baseline)
  | "CACHED"                // Local in-memory or database snapshot with explicit TTL
  | "HISTORICAL"            // Archived baseline datasets (e.g. past flood inundation maps)
  | "UNKNOWN";              // Unverified or degraded connector
```

---

## 3. Comprehensive Dataset Freshness Audit Matrix

| Dataset / Source | Origin Provider | Real Refresh Cycle | Freshness Enum | UI Badge Display |
| :--- | :--- | :--- | :--- | :--- |
| **Sentinel-1 SAR Swaths** | Copernicus Data Space | 3–6 Days Orbit Revisit | `ACQUISITION_DEPENDENT` | `Acquisition: Orbit Pass` |
| **Sentinel-2 Optical Swaths**| Copernicus Data Space | 5 Days Orbit Revisit | `ACQUISITION_DEPENDENT` | `Acquisition: Orbit Pass` |
| **Thermal Hotspots (FRP)** | NASA FIRMS (VIIRS/MODIS) | 3–6 Hours (NRT pass) | `NEAR_REAL_TIME` | `Near-Real-Time (FIRMS)` |
| **SACHET Disaster Warnings** | NDMA India CAP Feed | 10 Minutes Polling | `NEAR_REAL_TIME` | `Near-Real-Time (NDMA)` |
| **IMD Ground Observations** | India Meteorological Dept| 15 Minutes Polling | `NEAR_REAL_TIME` | `Near-Real-Time (IMD)` |
| **OpenWeather / Open-Meteo** | Weather Telemetry Grid | 15 Minutes Polling | `NEAR_REAL_TIME` | `Near-Real-Time (Weather)` |
| **WAQI Air Quality PM2.5** | WAQI / Open-Meteo AQI | 30 Minutes Polling | `NEAR_REAL_TIME` | `Near-Real-Time (AQI)` |
| **Critical Infrastructure** | OpenStreetMap Overpass | On-demand Sync / 30 Days | `PERIODIC` | `Cached Vector OSM` |
| **GIS Basemaps** | MapTiler / CARTO / Esri | Monthly Global Update | `PERIODIC` | `Vector / Satellite GIS` |
| **WebSocket Event Stream** | DRAXELYRA Realtime Outbox | Real-time Push ($<50$ ms) | `LIVE` | `Live WebSocket` |
| **Gemini AI Inferences** | Google Gemini API | On-demand Execution | `LIVE` | `Live AI Inference` |
| **Replay Demo Scenarios** | Deterministic Replay Seed | Static / Immutable | `CACHED` | `Cached Demo Replay` |

---

## 4. Cache Invalidation Policies
1. **OSM Infrastructure**: Spatial cache in `osm_critical_assets` indexed by geometry coordinates. Invalidated manually or automatically during major disaster AOI reconfiguration.
2. **Weather & AQI Telemetry**: In-memory and client-side TTL of 10 minutes (`staleTime: 600000`).
3. **Data Source Health Probes**: Active polling every 30 seconds on Data Sources dashboard with manual "Probe All Connectors" trigger.
