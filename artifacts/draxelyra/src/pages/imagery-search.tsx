import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Database,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  ExternalLink,
  Cpu,
  ArrowRight,
  Sparkles,
  Info,
  Radio,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

const INDIAN_REGIONS = {
  chennai: {
    name: "Chennai Metropolitan & Coastal Delta",
    aoi: {
      type: "Polygon",
      coordinates: [[[80.15, 12.95], [80.32, 12.95], [80.32, 13.15], [80.15, 13.15], [80.15, 12.95]]]
    }
  },
  mumbai: {
    name: "Mumbai MMR & Coastal Belt",
    aoi: {
      type: "Polygon",
      coordinates: [[[72.75, 18.85], [73.05, 18.85], [73.05, 19.30], [72.75, 19.30], [72.75, 18.85]]]
    }
  },
  kolkata: {
    name: "Kolkata & Hooghly Delta",
    aoi: {
      type: "Polygon",
      coordinates: [[[88.20, 22.40], [88.50, 22.40], [88.50, 22.75], [88.20, 22.75], [88.20, 22.40]]]
    }
  },
  guwahati: {
    name: "Guwahati Brahmaputra River Basin",
    aoi: {
      type: "Polygon",
      coordinates: [[[91.60, 26.10], [91.90, 26.10], [91.90, 26.25], [91.60, 26.25], [91.60, 26.10]]]
    }
  },
  kochi: {
    name: "Kochi Coastal & Vembanad Estuary",
    aoi: {
      type: "Polygon",
      coordinates: [[[76.15, 9.85], [76.40, 9.85], [76.40, 10.15], [76.15, 10.15], [76.15, 9.85]]]
    }
  },
  delhi: {
    name: "Delhi NCR Capital Region",
    aoi: {
      type: "Polygon",
      coordinates: [[[76.90, 28.40], [77.40, 28.40], [77.40, 28.90], [76.90, 28.90], [76.90, 28.40]]]
    }
  },
  wayanad: {
    name: "Wayanad Western Ghats (Landslide Zone)",
    aoi: {
      type: "Polygon",
      coordinates: [[[76.00, 11.50], [76.35, 11.50], [76.35, 11.85], [76.00, 11.85], [76.00, 11.50]]]
    }
  },
};

export default function ImagerySearchPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const now = new Date();
  const initialEnd = now.toISOString().split("T")[0];
  const initialStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [provider, setProvider] = useState("copernicus-stac");
  const [collection, setCollection] = useState("sentinel-1-grd");
  const [selectedRegionKey, setSelectedRegionKey] = useState<keyof typeof INDIAN_REGIONS>("chennai");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [maxCloudCover, setMaxCloudCover] = useState(30);
  const [targetIncidentId, setTargetIncidentId] = useState<string>("");
  const [importStatus, setImportStatus] = useState<Record<string, string>>({});

  const { data: incidentsList } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch("/api/incidents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const activeAoi = INDIAN_REGIONS[selectedRegionKey].aoi;

  const { data: searchResults, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["imagery-search", provider, collection, selectedRegionKey, startDate, endDate, maxCloudCover],
    queryFn: async () => {
      const res = await fetch("/api/imagery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          collection,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          maxCloudCover,
          aoi: activeAoi,
          limit: 15,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to search satellite catalog");
      }
      return res.json();
    },
    enabled: true,
  });

  const handleImport = async (item: any) => {
    setImportStatus((prev) => ({ ...prev, [item.externalId]: "importing" }));
    const resolvedIncidentId = targetIncidentId || incidentsList?.[0]?.id || "inc-fl-chennai-2026";
    try {
      const res = await fetch("/api/imagery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: resolvedIncidentId,
          externalProductId: item.externalId,
          provider: item.provider,
          collection: item.collection,
          title: item.externalId,
          acquisitionTime: item.datetime,
          geometry: item.geometry,
          bbox: item.bbox,
          sourceUrl: item.sourceUrl,
          catalogUrl: item.catalogUrl,
          processingLevel: item.processingLevel,
          cloudCover: item.cloudCover,
          qualityStatus: item.qualityStatus,
          dataMode: item.dataMode || "REAL",
          metadata: item.providerMetadata,
        }),
      });
      if (!res.ok) throw new Error("Failed to import");
      const data = await res.json();
      setImportStatus((prev) => ({ ...prev, [item.externalId]: "imported" }));
      queryClient.invalidateQueries({ queryKey: ["imagery-list"] });
      queryClient.invalidateQueries({ queryKey: ["incident-map"] });
    } catch (err: any) {
      setImportStatus((prev) => ({ ...prev, [item.externalId]: `error: ${err.message}` }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="font-mono-ui text-[10px] uppercase tracking-widest text-primary">
            Earth Observation / Satellite Discovery
          </div>
          <h1 className="font-display text-3xl uppercase tracking-tight text-foreground">
            Copernicus STAC Imagery Search
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search live Sentinel-1 SAR and Sentinel-2 optical catalogs by AOI polygon, filter cloud cover, and ingest metadata into the response pipeline.
          </p>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="border border-border bg-card p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              Geographic Region / AOI
            </label>
            <select
              value={selectedRegionKey}
              onChange={(e) => setSelectedRegionKey(e.target.value as any)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary font-medium"
            >
              {Object.entries(INDIAN_REGIONS).map(([k, reg]) => (
                <option key={k} value={k}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              Target Crisis Incident
            </label>
            <select
              value={targetIncidentId}
              onChange={(e) => setTargetIncidentId(e.target.value)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="">Auto-select Latest Active Incident</option>
              {(incidentsList || []).map((inc: any) => (
                <option key={inc.id} value={inc.id}>
                  [{inc.disasterType || "Incident"}] {inc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              Data Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="copernicus-stac">Copernicus STAC (Live)</option>
              <option value="copernicus-odata">Copernicus OData (Live)</option>
              <option value="demo">Deterministic Demo Mode</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              Satellite Collection
            </label>
            <select
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="sentinel-1-grd">Sentinel-1 GRD (SAR Radar - Flood & Inundation)</option>
              <option value="sentinel-2-l2a">Sentinel-2 L2A (Multispectral Optical)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground block mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-input bg-card px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {collection.includes("sentinel-2") && (
          <div className="border-t border-border/40 pt-3 flex items-center gap-4">
            <label className="text-[10px] font-mono-ui uppercase text-muted-foreground whitespace-nowrap">
              Max Cloud Cover: {maxCloudCover}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={maxCloudCover}
              onChange={(e) => setMaxCloudCover(Number(e.target.value))}
              className="w-48 accent-primary"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-border/40 pt-3">
          <div className="text-[11px] font-mono-ui text-muted-foreground flex items-center gap-1.5">
            <Info size={13} className="text-primary shrink-0" />
            Active AOI: {INDIAN_REGIONS[selectedRegionKey].name}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <Search size={13} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Querying STAC..." : "Search Real Satellite Data"}
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl uppercase">Discovered Satellite Products</h2>
        <span className="font-mono-ui text-xs text-muted-foreground">
          {searchResults?.items?.length || 0} catalog matches found
        </span>
      </div>

      {/* Results List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono-ui text-muted-foreground border border-border bg-card">
          Connecting to Copernicus Data Space Ecosystem STAC API...
        </div>
      ) : searchResults?.items?.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground border border-border bg-card">
          No satellite passes found for the selected AOI and time window. Try expanding the date range.
        </div>
      ) : (
        <div className="space-y-3">
          {(searchResults?.items || []).map((item: any) => {
            const status = importStatus[item.externalId];
            return (
              <div
                key={item.externalId}
                className="border border-border bg-card p-4 hover:border-primary/50 transition-colors space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono-ui text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-md md:max-w-lg">
                        {item.externalId}
                      </span>
                      <span
                        className={`font-mono-ui text-[9px] uppercase px-1.5 py-0.5 rounded-sm border ${
                          item.qualityStatus === "READY"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {item.qualityStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono-ui">
                      <span>Acquired: {new Date(item.datetime).toLocaleString()}</span>
                      <span>Platform: {item.platform}</span>
                      <span>Collection: {item.collection}</span>
                      {item.cloudCover !== undefined && <span>Cloud Cover: {item.cloudCover}%</span>}
                      {item.orbit && <span>Orbit: {item.orbit}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {item.catalogUrl && (
                      <a
                        href={item.catalogUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink size={12} /> STAC Portal
                      </a>
                    )}
                    <button
                      onClick={() => handleImport(item)}
                      disabled={status === "imported" || status === "importing"}
                      className="px-3 py-1.5 bg-primary/10 border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {status === "imported" ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-400" /> Imported
                        </>
                      ) : status === "importing" ? (
                        "Importing..."
                      ) : (
                        "Import Metadata"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleImport(item);
                        setLocation("/assessment");
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1"
                    >
                      Assess in AOI <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
