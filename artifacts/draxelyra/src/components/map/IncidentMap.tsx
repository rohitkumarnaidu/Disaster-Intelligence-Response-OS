import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Map, { Source, Layer, NavigationControl, MapRef } from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { WeatherPanel } from "../WeatherPanel";
import {
  Layers,
  Map as MapIcon,
  Globe,
  Building2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Crosshair,
  Shield,
  Eye,
  EyeOff,
  Maximize2,
  Satellite,
  Compass,
  Radio,
  MapPin,
  ChevronDown,
} from "lucide-react";

export const INDIAN_REGIONS = [
  { name: "Chennai Metropolitan (Tamil Nadu)", lat: 13.0827, lng: 80.2707, zoom: 11 },
  { name: "Mumbai & MMR (Maharashtra)", lat: 19.076, lng: 72.8777, zoom: 11 },
  { name: "Kolkata & Delta (West Bengal)", lat: 22.5726, lng: 88.3639, zoom: 11 },
  { name: "Guwahati & Brahmaputra (Assam)", lat: 26.1445, lng: 91.7362, zoom: 11 },
  { name: "Kochi & Coastal Plain (Kerala)", lat: 9.9312, lng: 76.2673, zoom: 11 },
  { name: "Delhi NCR (Capital Region)", lat: 28.6139, lng: 77.209, zoom: 11 },
  { name: "Bhubaneswar & Coastal Corridor (Odisha)", lat: 20.2961, lng: 85.8245, zoom: 11 },
  { name: "Wayanad Highland (Kerala)", lat: 11.6854, lng: 76.132, zoom: 11 },
  { name: "Shimla & Himalayan Slopes (Himachal Pradesh)", lat: 31.1048, lng: 77.1734, zoom: 11 },
  { name: "Dehradun Valley (Uttarakhand)", lat: 30.3165, lng: 78.0322, zoom: 11 },
];

const OSM_STYLE: any = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    "satellite-tiles": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "satellite-tiles-layer",
      type: "raster",
      source: "satellite-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function IncidentMap({
  incidentId,
  compact = false,
  showWeather = true,
}: {
  incidentId: string;
  compact?: boolean;
  showWeather?: boolean;
}) {
  const [, setLocation] = useLocation();
  const mapRef = useRef<MapRef>(null);
  const [mapStyleType, setMapStyleType] = useState<"streets" | "satellite">("streets");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showRegionMenu, setShowRegionMenu] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [activeRegionName, setActiveRegionName] = useState<string | null>(null);

  const [layerVisibility, setLayerVisibility] = useState({
    aoi: true,
    footprints: true,
    assets: true,
    detections: true,
    fireDetections: true,
    alerts: true,
    cases: true,
    observations: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["incident-map", incidentId],
    queryFn: async () => {
      const res = await customFetch<{
        aoi?: any;
        cases?: any;
        criticalAssets?: any;
        detections?: any;
        fireDetections?: any;
        alerts?: any;
        fieldObservations?: any;
        imageryFootprints?: any;
      }>(`/api/incidents/${incidentId}/map`);
      return res;
    },
  });

  const centerCoords = useMemo(() => {
    let lng = 80.27;
    let lat = 13.08;

    if (data?.cases?.features?.[0]?.geometry?.coordinates) {
      const coords = data.cases.features[0].geometry.coordinates;
      if (typeof coords[0] === "number") {
        lng = coords[0];
        lat = coords[1];
      }
    } else if (data?.criticalAssets?.features?.[0]?.geometry?.coordinates) {
      const coords = data.criticalAssets.features[0].geometry.coordinates;
      if (typeof coords[0] === "number") {
        lng = coords[0];
        lat = coords[1];
      }
    } else if (data?.detections?.features?.[0]?.geometry?.coordinates) {
      const coords = data.detections.features[0].geometry.coordinates;
      if (typeof coords[0] === "number") {
        lng = coords[0];
        lat = coords[1];
      }
    } else if (data?.fireDetections?.features?.[0]?.geometry?.coordinates) {
      const coords = data.fireDetections.features[0].geometry.coordinates;
      if (typeof coords[0] === "number") {
        lng = coords[0];
        lat = coords[1];
      }
    } else if (data?.aoi?.geometry?.coordinates?.[0]?.[0]) {
      const coords = data.aoi.geometry.coordinates[0][0];
      if (typeof coords[0] === "number") {
        lng = coords[0];
        lat = coords[1];
      }
    }

    return { lng, lat };
  }, [data]);

  useEffect(() => {
    if (mapRef.current && centerCoords && !isNaN(centerCoords.lng) && !isNaN(centerCoords.lat)) {
      mapRef.current.flyTo({
        center: [centerCoords.lng, centerCoords.lat],
        zoom: 10,
        duration: 1200,
      });
    }
  }, [centerCoords.lng, centerCoords.lat, incidentId]);

  const handleSelectRegion = (region: (typeof INDIAN_REGIONS)[0]) => {
    setActiveRegionName(region.name);
    setShowRegionMenu(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [region.lng, region.lat],
        zoom: region.zoom,
        duration: 1800,
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-950 text-slate-400 ${
          compact ? "h-[190px]" : "h-[480px]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <span className="font-mono-ui text-xs uppercase tracking-wider">Syncing Multi-Hazard Layers...</span>
        </div>
      </div>
    );
  }

  const mapProps: any = {
    initialViewState: { longitude: centerCoords.lng, latitude: centerCoords.lat, zoom: 10 },
    mapStyle: mapStyleType === "satellite" ? SATELLITE_STYLE : OSM_STYLE,
    mapLib: maplibregl,
    interactive: true,
    style: { width: "100%", height: "100%" },
    onClick: (e: any) => {
      const feature = e.features?.[0];
      if (!feature) {
        setSelectedFeature(null);
        return;
      }
      setSelectedFeature(feature);
    },
    interactiveLayerIds: [
      "cases-layer",
      "assets-layer",
      "detections-layer",
      "fire-detections-layer",
      "alerts-layer-fill",
      "observations-layer",
      "imagery-footprints-fill",
    ],
  };

  const toggleLayer = (key: keyof typeof layerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`relative w-full overflow-hidden border border-slate-800 rounded-lg shadow-2xl bg-slate-950 ${
        compact ? "h-[190px]" : "h-[500px]"
      }`}
    >
      <Map ref={mapRef} {...mapProps}>
        <NavigationControl position="bottom-right" />

        {/* AOI Extent Layer */}
        {layerVisibility.aoi && data?.aoi && (
          <Source id="aoi" type="geojson" data={data.aoi}>
            <Layer
              id="aoi-layer"
              type="fill"
              paint={{ "fill-color": "#259184", "fill-opacity": 0.15 }}
            />
            <Layer
              id="aoi-layer-line"
              type="line"
              paint={{ "line-color": "#259184", "line-width": 2, "line-dasharray": [2, 2] }}
            />
          </Source>
        )}

        {/* Satellite Imagery Footprints Layer */}
        {layerVisibility.footprints && data?.imageryFootprints && (
          <Source id="imagery-footprints" type="geojson" data={data.imageryFootprints}>
            <Layer
              id="imagery-footprints-fill"
              type="fill"
              paint={{ "fill-color": "#38bdf8", "fill-opacity": 0.12 }}
            />
            <Layer
              id="imagery-footprints-line"
              type="line"
              paint={{ "line-color": "#38bdf8", "line-width": 1.5, "line-dasharray": [3, 2] }}
            />
          </Source>
        )}

        {/* Official SACHET / Weather Warning Boundaries Layer */}
        {layerVisibility.alerts && data?.alerts && (
          <Source id="alerts" type="geojson" data={data.alerts}>
            <Layer
              id="alerts-layer-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "match",
                  ["get", "severity"],
                  "Extreme",
                  "#dc2626",
                  "Severe",
                  "#ea580c",
                  "Moderate",
                  "#eab308",
                  "#f97316",
                ],
                "fill-opacity": 0.22,
              }}
            />
            <Layer
              id="alerts-layer-line"
              type="line"
              paint={{
                "line-color": "#ea580c",
                "line-width": 2,
                "line-dasharray": [4, 2],
              }}
            />
          </Source>
        )}

        {/* Critical Infrastructure Assets */}
        {layerVisibility.assets && data?.criticalAssets && (
          <Source id="assets" type="geojson" data={data.criticalAssets}>
            <Layer
              id="assets-layer"
              type="circle"
              paint={{
                "circle-radius": 8,
                "circle-color": "#475569",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#f8fafc",
              }}
            />
          </Source>
        )}

        {/* Satellite / Model AI Detections */}
        {layerVisibility.detections && data?.detections && (
          <Source id="detections" type="geojson" data={data.detections}>
            <Layer
              id="detections-layer"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "#ef4444",
                "circle-opacity": 0.85,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}

        {/* NASA FIRMS Active Fire / Thermal Anomalies Layer */}
        {layerVisibility.fireDetections && data?.fireDetections && (
          <Source id="fire-detections" type="geojson" data={data.fireDetections}>
            <Layer
              id="fire-detections-layer"
              type="circle"
              paint={{
                "circle-radius": 7,
                "circle-color": "#ff4500",
                "circle-opacity": 0.9,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffd700",
              }}
            />
          </Source>
        )}

        {/* Triage Cases with Dynamic Status Colors */}
        {layerVisibility.cases && data?.cases && (
          <Source id="cases" type="geojson" data={data.cases}>
            <Layer
              id="cases-layer"
              type="circle"
              paint={{
                "circle-radius": 8,
                "circle-color": [
                  "match",
                  ["get", "status"],
                  "NEEDS_REVIEW",
                  "#eab308",
                  "CONFIRMED",
                  "#22c55e",
                  "REJECTED",
                  "#ef4444",
                  "TASKED",
                  "#3b82f6",
                  "FIELD_VERIFIED",
                  "#10b981",
                  "CLOSED",
                  "#64748b",
                  "#eab308",
                ],
                "circle-stroke-width": 2.5,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}

        {/* Field Observations */}
        {layerVisibility.observations && data?.fieldObservations && (
          <Source id="observations" type="geojson" data={data.fieldObservations}>
            <Layer
              id="observations-layer"
              type="circle"
              paint={{
                "circle-radius": 7,
                "circle-color": "#10b981",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}
      </Map>

      {/* Top Left Controls: Base Switcher + Layers + India AOI Switcher */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMapStyleType("streets")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              mapStyleType === "streets" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapStyleType("satellite")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              mapStyleType === "satellite" ? "bg-teal-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Satellite
          </button>
        </div>

        {/* India AOI Quick-Switcher */}
        {!compact && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRegionMenu(!showRegionMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              {activeRegionName ? activeRegionName.split(" ")[0] : "India AOI Switcher"}
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </button>

            {showRegionMenu && (
              <div className="absolute top-full mt-2 left-0 w-64 max-h-80 overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl p-2 space-y-1 backdrop-blur-xl z-50">
                <div className="text-[10px] font-mono-ui uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                  <span>Pan to Indian Region</span>
                  <MapPin className="w-3 h-3 text-teal-400" />
                </div>
                {INDIAN_REGIONS.map((region) => (
                  <button
                    key={region.name}
                    type="button"
                    onClick={() => handleSelectRegion(region)}
                    className="w-full text-left px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md transition-colors flex items-center justify-between"
                  >
                    <span>{region.name}</span>
                    <span className="text-[10px] font-mono-ui text-slate-400">
                      {region.lat.toFixed(1)}°N, {region.lng.toFixed(1)}°E
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!compact && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              Layers
            </button>

            {showLayerMenu && (
              <div className="absolute top-full mt-2 left-0 w-60 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl p-2.5 space-y-1 backdrop-blur-xl z-50">
                <div className="text-[10px] font-mono-ui uppercase tracking-wider text-slate-400 px-2 py-1">
                  Layer Visibility
                </div>
                <button
                  type="button"
                  onClick={() => toggleLayer("cases")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" /> Priority Cases
                  </span>
                  {layerVisibility.cases ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("fireDetections")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> FIRMS Thermal Hotspots
                  </span>
                  {layerVisibility.fireDetections ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("alerts")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> SACHET CAP Alerts
                  </span>
                  {layerVisibility.alerts ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("footprints")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Satellite Footprints
                  </span>
                  {layerVisibility.footprints ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("assets")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Critical Assets
                  </span>
                  {layerVisibility.assets ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("detections")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> AI Detections
                  </span>
                  {layerVisibility.detections ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("observations")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Field Observations
                  </span>
                  {layerVisibility.observations ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLayer("aoi")}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800 rounded-md"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" /> AOI Extent
                  </span>
                  {layerVisibility.aoi ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Feature Detail Card */}
      {selectedFeature && (
        <div className="absolute bottom-4 left-4 z-40 max-w-sm bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl text-slate-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono-ui text-[9px] uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                {selectedFeature.source === "fire-detections" && <Flame className="w-3 h-3 text-orange-400" />}
                {selectedFeature.source === "alerts" && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                {selectedFeature.source === "cases"
                  ? "Priority Case"
                  : selectedFeature.source === "assets"
                  ? "Critical Asset"
                  : selectedFeature.source === "imagery-footprints"
                  ? "Satellite Footprint"
                  : selectedFeature.source === "fire-detections"
                  ? "NASA FIRMS Hotspot"
                  : selectedFeature.source === "alerts"
                  ? "SACHET Warning Area"
                  : "Detection"}
              </div>
              <h4 className="text-sm font-semibold text-white mt-0.5">
                {selectedFeature.properties?.name ||
                  selectedFeature.properties?.headline ||
                  selectedFeature.properties?.title ||
                  selectedFeature.properties?.class ||
                  `ID: ${selectedFeature.properties?.id}`}
              </h4>
              {selectedFeature.properties?.source && (
                <div className="text-[10px] font-mono-ui text-slate-400 mt-0.5">
                  Source: {selectedFeature.properties.source}
                </div>
              )}
              {selectedFeature.properties?.frp !== undefined && (
                <div className="text-xs text-orange-400 font-mono-ui mt-0.5">
                  Fire Radiative Power (FRP): {selectedFeature.properties.frp} MW | Sat: {selectedFeature.properties.satellite}
                </div>
              )}
              {selectedFeature.properties?.severity && (
                <div className="text-xs text-amber-400 font-mono-ui mt-0.5">
                  Severity: {selectedFeature.properties.severity}
                </div>
              )}
              {selectedFeature.properties?.acquisitionTime && (
                <div className="text-xs text-slate-400 mt-0.5">
                  Acquired: {new Date(selectedFeature.properties.acquisitionTime).toLocaleString()}
                </div>
              )}
              {selectedFeature.properties?.priority && (
                <div className="text-xs font-mono-ui text-amber-400 mt-1">
                  Priority: {selectedFeature.properties.priority} pts
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              &times;
            </button>
          </div>
          {selectedFeature.source === "cases" && selectedFeature.properties?.id && (
            <button
              onClick={() => setLocation(`/cases/${selectedFeature.properties.id}`)}
              className="mt-3 w-full py-1.5 px-2 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-xs font-semibold transition-colors"
            >
              Open Case Detail
            </button>
          )}
        </div>
      )}

      {/* Coordinates readout */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-full font-mono-ui text-[10px] text-slate-400 backdrop-blur-sm">
        AOI Centroid: {centerCoords.lat.toFixed(4)}° N, {centerCoords.lng.toFixed(4)}° E
      </div>

      {/* Floating Weather Panel */}
      {showWeather && !compact && (
        <WeatherPanel lat={centerCoords.lat} lng={centerCoords.lng} />
      )}
    </div>
  );
}
