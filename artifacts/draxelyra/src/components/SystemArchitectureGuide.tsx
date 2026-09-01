import React, { useState } from "react";
import {
  BrainCircuit,
  Satellite,
  Database,
  CheckCircle2,
  ListFilter,
  Navigation,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface SystemArchitectureGuideProps {
  metrics?: {
    backlog?: number;
    highPriority?: number;
    openTasks?: number;
  };
}

export function SystemArchitectureGuide({ metrics }: SystemArchitectureGuideProps) {
  const [expanded, setExpanded] = useState(true);

  const stages = [
    {
      step: "01",
      title: "Multi-Source Data Ingestion",
      icon: Satellite,
      badge: "Real External APIs",
      description:
        "Ingests real geospatial satellite swaths (Copernicus Sentinel-1 SAR & Sentinel-2 Optical), global disaster feeds (NASA EONET, USGS), and OpenStreetMap critical infrastructure.",
      link: "/data-sources",
      linkLabel: "Inspect Data Sources",
    },
    {
      step: "02",
      title: "AI Multimodal & Vision Triage",
      icon: BrainCircuit,
      badge: "Gemini + CV Engine",
      description:
        "Computes radar backscatter coherence difference and runs Gemini Multimodal assessment, separating directly observed damage from inferred infrastructure impact.",
      link: "/assessment",
      linkLabel: "View Assessment Map",
    },
    {
      step: "03",
      title: "Deterministic 5-Factor Priority",
      icon: ListFilter,
      badge: "Mathematical Formula",
      description:
        "Calculates authoritative 0–100 priority score using explainable weights: 30% Severity + 25% Criticality + 20% Exposure + 15% Urgency + 10% Confidence.",
      link: "/cases",
      linkLabel: "Explore Priority Queue",
    },
    {
      step: "04",
      title: "Human Governance & Review",
      icon: ShieldCheck,
      badge: "Zero Unchecked AI",
      description:
        "Human analysts review evidence comparison sliders and confirm, reject (false positives), or flag uncertain cases with Optimistic Concurrency Control (OCC).",
      link: "/cases",
      linkLabel: "Review Cases",
    },
    {
      step: "05",
      title: "Response Dispatch & Field Check",
      icon: Navigation,
      badge: "SLA Tracking",
      description:
        "Dispatches field responder units, tracks real-time response SLA deadlines, and records geo-tagged ground truth observations.",
      link: "/tasks",
      linkLabel: "Dispatch Response",
    },
  ];

  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 md:p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg tracking-wide uppercase text-foreground">
                How DRAXELYRA Response OS Works
              </h2>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                <Activity className="h-2.5 w-2.5 mr-1 animate-pulse" />
                Live Dynamic OS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              End-to-end disaster intelligence pipeline: from satellite radar ingestion to ground field dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? (
            <>
              Hide Flow <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Explain System <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 space-y-4 pt-4 border-t border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.step}
                  className="bg-muted/30 border border-border/50 rounded-lg p-3.5 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono-ui text-[10px] font-bold text-primary">
                        STAGE {stage.step}
                      </span>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-xs text-foreground mb-1">
                      {stage.title}
                    </h3>
                    <Badge variant="secondary" className="text-[9px] mb-2">
                      {stage.badge}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <Link
                    href={stage.link}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-2 border-t border-border/30"
                  >
                    {stage.linkLabel} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground/90">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>100% Live Backend Database:</strong> All metrics, cases, satellite imagery metadata, and priority calculations are stored and queried in real-time from PostgreSQL / PGlite.
              </span>
            </div>
            <Link
              href="/demo"
              className="px-3 py-1.5 rounded-sm bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 whitespace-nowrap"
            >
              Load Scenario Replay
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
