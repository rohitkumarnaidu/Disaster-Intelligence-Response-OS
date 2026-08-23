# Coordinate Reference Systems (CRS)

<span className="badge-implemented">Implemented</span>

- **Internal Storage & GeoJSON Standard**: **WGS 84 (EPSG:4326)** — standard longitude/latitude coordinates in decimal degrees.
- **Tile Rendering**: **Web Mercator (EPSG:3857)** — projected dynamically by MapLibre GL.
- **Format Order**: GeoJSON RFC 7946 strictly requires `[longitude, latitude]` coordinate ordering.
