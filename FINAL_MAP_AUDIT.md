# DRAXELYRA — FINAL MAP & GEOSPATIAL AUDIT
**Disaster Intelligence & Response OS**
*Certified: 2026-09-01 | GIS Engine: MapLibre GL + React-Map-GL + Dynamic Vector Tiles*

---

## 1. Geospatial Map Architecture Overview
The DRAXELYRA GIS subsystem delivers high-performance, GPU-accelerated spatial rendering across any operational Area of Interest (AOI) globally and throughout the Republic of India.

- **Frontend Technology**: `react-map-gl/maplibre` with WebGL2 rendering via `maplibre-gl`.
- **Cartographic Basemaps**:
  1. *Vector Streets*: CARTO Voyager vector & raster tiles with OpenStreetMap attribution.
  2. *High-Resolution Satellite*: Esri World Imagery (0.5m–15m resolution) + MapTiler Satellite Cloud.

---

## 2. Multi-Hazard Geospatial Layer Hierarchy

```
[Layer 8: Top]   Field Observations (Emerald Circle Markers)
[Layer 7]        Priority Triage Cases (Color-coded by Status: Gold, Green, Red, Blue)
[Layer 6]        NASA FIRMS Thermal Hotspots (Flame Orange / Amber Markers, FRP-sized)
[Layer 5]        AI Damage Detections (Red Highlight Points & Footprints)
[Layer 4]        Critical Infrastructure Nodes (Dark Slate with White Stroke)
[Layer 3]        SACHET / IMD Warning Polygons (Orange/Red Translucent Warning Zones)
[Layer 2]        Copernicus Satellite Footprints (Cyan Orbit Bounding Polygons)
[Layer 1]        Incident AOI Boundary (Teal Fill + Dashed Outer Perimeter)
[Layer 0: Base]  Vector Streets / High-Resolution Satellite Basemap
```

---

## 3. All-India Operational AOI Quick-Switcher
The interactive map provides 1-click smooth animated camera transitions (`flyTo`) across 10 strategic Indian emergency hubs without requiring hardcoded page reloads:

| Region | Latitude | Longitude | Strategic Hazard Focus |
| :--- | :--- | :--- | :--- |
| **Chennai Metropolitan** | 13.0827° N | 80.2707° E | Coastal Surge, Cyclone, Urban Flood |
| **Mumbai & MMR** | 19.0760° N | 72.8777° E | High-Tide Monsoonal Inundation |
| **Kolkata & Delta** | 22.5726° N | 88.3639° E | Bay of Bengal Cyclonic Storm Surge |
| **Guwahati & Valley** | 26.1445° N | 91.7362° E | Brahmaputra Riverine Basin Flood |
| **Kochi & Coastal Plain** | 9.9312° N | 76.2673° E | Arabian Sea Inundation & Estuary Surge |
| **Delhi NCR** | 28.6139° N | 77.2090° E | Severe Atmospheric Pollution (AQI) & Heat |
| **Bhubaneswar Corridor** | 20.2961° N | 85.8245° E | Eastern Coastal Supercyclone Corridor |
| **Wayanad Highland** | 11.6854° N | 76.1320° E | Western Ghats Monsoonal Landslides |
| **Shimla Himalayan Slopes** | 31.1048° N | 77.1734° E | Cloudbursts & Steep Slope Instability |
| **Dehradun Valley** | 30.3165° N | 78.0322° E | Foothill Flash Floods & Debris Flows |

---

## 4. Interactive Triage Cards & Popups
Clicking on any active element on the map renders an contextual detail card with direct operational shortcuts:
- **FIRMS Hotspot**: Displays Fire Radiative Power (FRP in MW), detecting satellite (`VIIRS_SNPP` / `MODIS`), and acquisition timestamp.
- **SACHET Warning**: Displays official CAP severity (`Extreme`, `Severe`, `Moderate`), issuing agency (NDMA), and safety instructions.
- **Priority Case**: Displays composite priority score ($0–100$), associated critical asset, and "Open Case Detail" navigation button.
