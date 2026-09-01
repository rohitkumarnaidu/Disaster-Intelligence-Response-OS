---
id: terminology
title: Technical Terminology & Operational Glossary
sidebar_label: Terminology
sidebar_position: 4
---

# Technical Terminology & Operational Glossary

<span className="badge-implemented">Implemented</span>

This glossary provides exact definitions and implementation contexts for domain concepts, remote sensing standards, GIS terminology, database mechanics, and real-time distributed patterns used throughout DRAXELYRA.

---

## Remote Sensing & Geospatial Intelligence

| Term / Acronym | Full Definition | Operational Context in DRAXELYRA |
| :--- | :--- | :--- |
| **AOI** | Area of Interest | RFC 7946 GeoJSON Polygon or MultiPolygon establishing the spatial extent of an active incident. Restricts all API queries, OSM infrastructure fetches, and satellite catalog searches. |
| **SAR** | Synthetic Aperture Radar | Active microwave radar imaging (e.g., Sentinel-1 C-band) capable of penetrating cloud cover, smoke, and nocturnal darkness. Used for flood inundation mapping via backscatter attenuation. |
| **GRD** | Ground Range Detected | Sentinel-1 SAR product format projected onto the Earth ellipsoid with multi-looked intensity values. |
| **MSI** | MultiSpectral Instrument | Optical sensor constellation (e.g., Sentinel-2 13 spectral bands) used for normalized difference water and vegetation indices. |
| **NDWI / MNDWI** | Normalized Difference Water Index / Modified NDWI | Spectral ratio formulas ($(\text{Green} - \text{NIR})/(\text{Green} + \text{NIR})$ and $(\text{Green} - \text{SWIR})/(\text{Green} + \text{SWIR})$) used to extract surface water boundaries from optical passes. |
| **FRP** | Fire Radiative Power | Quantitative metric (Megawatts, MW) measured by NASA FIRMS VIIRS/MODIS sensors indicating instantaneous thermal output of wildfire hotspots. |
| **STAC** | SpatioTemporal Asset Catalog | JSON-based specification for discovering and indexing Earth Observation imagery collections across cloud providers (Copernicus CDSE, Planetary Computer). |
| **EPSG:4326** | WGS 84 Coordinate Reference System | Standard latitude/longitude spherical coordinate system used across all database GeoJSON columns and MapLibre layers. |
| **BBox** | Bounding Box | Array of four floats `[minLon, minLat, maxLon, maxLat]` representing spatial extents for map bounds fitting and vector clipping. |
| **Overpass QL** | OpenStreetMap Overpass Query Language | Read-only API syntax used by `osm-sync.ts` to extract hospitals, emergency shelters, substations, and bridges in real time. |

---

## Operational Triage & Priority Domain

| Term / Acronym | Full Definition | Operational Context in DRAXELYRA |
| :--- | :--- | :--- |
| **Case** | Operational Incident Unit | Core transactional object binding a satellite detection, critical infrastructure asset, 5-factor priority score, human review decision, and audit history. |
| **FSM** | Finite State Machine | Strict mathematical model enforcing valid state transitions for Cases (`DETECTED -> CLOSED`) and Tasks (`UNASSIGNED -> CLOSED`). Disallows illegal transitions. |
| **Human-in-the-Loop (HITL)** | Authoritative Human Adjudication | Protocol mandating that AI change detections remain suggestions until an authenticated Duty Officer or Incident Commander explicitly submits a confirmation review. |
| **SLA** | Service Level Agreement | Dynamic operational window for task execution based on priority tier ($\ge 75 \to 30\text{ min}$, $45\text{--}74 \to 2\text{ hr}$, $< 45 \to 8\text{ hr}$). |
| **5-Factor Priority** | Deterministic Priority Engine | Mathematical formula combining Severity ($30\%$), Facility Criticality ($25\%$), Population Exposure ($20\%$), Time Urgency ($15\%$), and Model Confidence ($10\%$). |
| **Urgency Decay** | Linear Time Degradation | Function reducing urgency score linearly over 72 hours post-incident ($100 - (\text{hours}/72)\cdot 100$), with a $+20$ penalty for access-constrained facilities. |

---

## Backend, Database & Concurrency

| Term / Acronym | Full Definition | Operational Context in DRAXELYRA |
| :--- | :--- | :--- |
| **OCC** | Optimistic Concurrency Control | Concurrency control pattern using an integer `version` column. Prevents silent data overwrite when multiple operators adjudicate cases concurrently. |
| **CAS** | Compare-And-Swap | Atomic database update pattern (`WHERE id = :id AND version = :expectedVersion`). Returns HTTP 409 `VERSION_CONFLICT` upon concurrency clash. |
| **Transactional Outbox** | Outbox Pattern | Architectural pattern where domain events are inserted into the `outbox_events` table within the same ACID transaction as the business mutation, guaranteeing zero event loss. |
| **Drizzle ORM** | TypeScript SQL ORM | Type-safe schema builder and query toolkit defining PostgreSQL tables in `lib/db/src/schema/index.ts`. |
| **connect-pg-simple** | PostgreSQL Session Store | Middleware persisting Express sessions into PostgreSQL `session` table with automatic expiration cleanup. |
| **RBAC** | Role-Based Access Control | Middleware (`requireAuth`, `requireRole`) validating user permissions against session roles before route handler execution. |
| **Magic Bytes** | File Header Signatures | Leading binary bytes (e.g., `FF D8 FF` for JPEG, `89 50 4E 47` for PNG) verified in evidence uploads to block malicious payload renaming. |

---

## Real-Time & Offline Architecture

| Term / Acronym | Full Definition | Operational Context in DRAXELYRA |
| :--- | :--- | :--- |
| **SSE** | Server-Sent Events | Unidirectional HTTP streaming transport (`/api/events`) pushing real-time domain events to web clients. |
| **WebSocket** | Full-Duplex Socket (`/ws`) | Bidirectional WebSocket connection with cookie session authentication, channel subscriptions, and 25s ping-pong heartbeats. |
| **IndexedDB** | In-Browser NoSQL Database | Storage engine (`draxelyra-offline`) buffering field observations and task updates during complete cellular/network disconnections. |
| **BroadcastChannel** | Multi-Tab Browser Sync | Web API synchronizing incoming WebSocket domain events and query cache invalidations across multiple open browser tabs. |
| **PWA** | Progressive Web App | Web application configured with Service Worker (`/sw.js`) and manifest allowing installable offline operations on mobile tablets. |

