import { useQuery } from "@tanstack/react-query";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocation } from "wouter";

const OSM_STYLE: any = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

export function IncidentMap({ incidentId, compact = false }: { incidentId: string, compact?: boolean }) {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["incident-map", incidentId],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}/map`);
      if (!res.ok) throw new Error("Failed to fetch map data");
      return res.json();
    }
  });

  if (isLoading) return <div className={`flex items-center justify-center bg-[#d8e5e1] ${compact ? "h-[190px]" : "h-[440px]"}`}>Loading Map...</div>;

  const mapProps: any = {
    initialViewState: { longitude: 80.27, latitude: 13.08, zoom: 12.5 },
    mapStyle: OSM_STYLE,
    mapLib: maplibregl,
    interactive: true,
    style: { width: "100%", height: "100%" },
    onClick: (e: any) => {
      const feature = e.features?.[0];
      if (!feature) return;
      if (feature.source === "cases") setLocation(`/cases/${feature.properties?.id}`);
      else if (feature.source === "assets") alert(`Asset: ${feature.properties?.name} (${feature.properties?.type})`);
    },
    interactiveLayerIds: ["cases-layer", "assets-layer"]
  };
  const navProps: any = { position: "bottom-right" };

  return (
    <div className={`relative w-full overflow-hidden border border-border ${compact ? "h-[190px]" : "h-[440px]"}`}>
      <Map {...mapProps}>
        <NavigationControl {...navProps} />
        {data?.aoi && (
          <Source id="aoi" type="geojson" data={data.aoi}>
            <Layer
              id="aoi-layer"
              type="fill"
              paint={{ "fill-color": "#259184", "fill-opacity": 0.1 }}
            />
            <Layer
              id="aoi-layer-line"
              type="line"
              paint={{ "line-color": "#259184", "line-width": 2, "line-dasharray": [2, 2] }}
            />
          </Source>
        )}
        {data?.criticalAssets && (
          <Source id="assets" type="geojson" data={data.criticalAssets}>
            <Layer
              id="assets-layer"
              type="circle"
              paint={{ "circle-radius": 8, "circle-color": "#4a5568", "circle-stroke-width": 1, "circle-stroke-color": "#ffffff" }}
            />
          </Source>
        )}
        {data?.detections && (
          <Source id="detections" type="geojson" data={data.detections}>
            <Layer
              id="detections-layer"
              type="circle"
              paint={{ "circle-radius": 4, "circle-color": "#cd372f", "circle-opacity": 0.6 }}
            />
          </Source>
        )}
        {data?.cases && (
          <Source id="cases" type="geojson" data={data.cases}>
            <Layer
              id="cases-layer"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": [
                  "match", ["get", "status"],
                  "NEEDS_REVIEW", "#EFAC30", "CONFIRMED", "#259184",
                  "REJECTED", "#cd372f", "CLOSED", "#8b9b95", "#EFAC30"
                ],
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
              }}
            />
          </Source>
        )}
        {data?.fieldObservations && (
          <Source id="observations" type="geojson" data={data.fieldObservations}>
            <Layer
              id="observations-layer"
              type="circle"
              paint={{ "circle-radius": 5, "circle-color": "#259184", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}

