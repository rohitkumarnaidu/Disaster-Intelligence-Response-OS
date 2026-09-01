import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  ExternalLink,
  Shield,
  Layers,
  Radio,
  Server,
  Zap,
} from "lucide-react";

export default function DataSourcesPage() {
  const queryClient = useQueryClient();
  const [syncingOsm, setSyncingOsm] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [targetIncidentId, setTargetIncidentId] = useState<string>("");

  const { data: incidentsList } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await fetch("/api/incidents");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: sources, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["data-sources-health"],
    queryFn: async () => {
      const res = await fetch("/api/data-sources/health");
      if (!res.ok) throw new Error("Failed to fetch data source health");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: osmStatus, refetch: refetchOsm } = useQuery({
    queryKey: ["osm-status"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/osm/status");
      if (!res.ok) throw new Error("Failed to fetch OSM status");
      return res.json();
    },
  });

  const handleSyncOsm = async () => {
    setSyncingOsm(true);
    setSyncMessage(null);
    const resolvedIncidentId = targetIncidentId || incidentsList?.[0]?.id || "inc-fl-chennai-2026";
    try {
      const res = await fetch("/api/integrations/osm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: resolvedIncidentId }),
      });
      const data = await res.json();
      setSyncMessage(data.message || "OpenStreetMap synchronization complete.");
      refetchOsm();
      queryClient.invalidateQueries({ queryKey: ["incident-map"] });
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message}`);
    } finally {
      setSyncingOsm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-ui font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={11} /> HEALTHY
          </span>
        );
      case "CONFIGURED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-ui font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Server size={11} /> CONFIGURED
          </span>
        );
      case "DEGRADED":
      case "RATE_LIMITED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-ui font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={11} /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-ui font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle size={11} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="font-mono-ui text-[10px] uppercase tracking-widest text-primary">
            Data Platform & External Integration Registry
          </div>
          <h1 className="font-display text-3xl uppercase tracking-tight text-foreground">
            Data Sources & Live Connectors
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time health, latency, authentication, and ingestion feeds for Earth Observation and vector pipelines.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-3 py-2 border border-border bg-card text-xs font-semibold hover:border-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefetching ? "animate-spin text-primary" : ""} />
            Probe All Connectors
          </button>
        </div>
      </div>

      {/* Integration Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono-ui text-muted-foreground border border-border bg-card">
          Querying live provider endpoints and computing latencies...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(sources || []).map((source: any) => (
            <div key={source.provider} className="border border-border bg-card p-4 space-y-3 flex flex-col justify-between hover:border-border/80 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 border border-border bg-secondary/50 rounded-sm">
                      <Database size={15} className="text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground leading-tight">{source.name}</div>
                      <div className="font-mono-ui text-[10px] text-muted-foreground">{source.type}</div>
                    </div>
                  </div>
                  {getStatusBadge(source.status)}
                </div>

                <div className="mt-4 space-y-1.5 font-mono-ui text-[11px] border-t border-border/40 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="text-foreground font-medium">{source.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Freshness:</span>
                    <span className="text-amber-400 font-semibold">{source.freshnessClass || "NEAR_REAL_TIME"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coverage:</span>
                    <span className="text-foreground text-[10px]">{source.coverage || "GLOBAL"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className="text-primary font-medium">{source.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth State:</span>
                    <span className="text-foreground">{source.authenticated ? "Verified & Authenticated" : source.configured ? "Configured" : "Public / Unauthenticated"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checked:</span>
                    <span className="text-muted-foreground">{source.checkedAt ? new Date(source.checkedAt).toLocaleTimeString() : "—"}</span>
                  </div>
                  {source.lastError && (
                    <div className="mt-2 p-1.5 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] rounded">
                      {source.lastError}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[10px] font-mono-ui">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                </span>
                <span className="text-muted-foreground">Zero-Trust Probed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OpenStreetMap Sync Management Panel */}
      <div className="border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <h2 className="font-display text-xl uppercase">OpenStreetMap Infrastructure Cache</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cached critical infrastructure (hospitals, schools, bridges, fire stations, utilities) used for spatial joins without repeated Overpass API throttling.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={targetIncidentId}
              onChange={(e) => setTargetIncidentId(e.target.value)}
              className="border border-input bg-background px-3 py-1.5 text-xs outline-none focus:border-primary max-w-xs"
            >
              <option value="">Auto-select Latest Incident</option>
              {(incidentsList || []).map((inc: any) => (
                <option key={inc.id} value={inc.id}>
                  [{inc.disasterType || "Crisis"}] {inc.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSyncOsm}
              disabled={syncingOsm}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={13} className={syncingOsm ? "animate-spin" : ""} />
              {syncingOsm ? "Syncing from Overpass..." : "Sync Incident Assets"}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 bg-primary/10 border border-primary/30 text-primary text-xs font-mono-ui">
            {syncMessage}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3 font-mono-ui text-xs">
          <div className="border border-border p-3 bg-secondary/20">
            <div className="text-[10px] text-muted-foreground uppercase">Cached Assets</div>
            <div className="font-display text-2xl mt-1 text-foreground">{osmStatus?.cachedAssetCount || 0}</div>
          </div>
          <div className="border border-border p-3 bg-secondary/20">
            <div className="text-[10px] text-muted-foreground uppercase">Last Synchronized</div>
            <div className="text-xs mt-2 text-foreground truncate">
              {osmStatus?.lastSyncAt ? new Date(osmStatus.lastSyncAt).toLocaleString() : "Never"}
            </div>
          </div>
          <div className="border border-border p-3 bg-secondary/20">
            <div className="text-[10px] text-muted-foreground uppercase">Attribution</div>
            <div className="text-xs mt-2 text-primary font-medium">© OpenStreetMap contributors</div>
          </div>
        </div>
      </div>
    </div>
  );
}
