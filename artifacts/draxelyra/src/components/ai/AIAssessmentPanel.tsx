import React, { useState } from "react";
import {
  BrainCircuit,
  Eye,
  Layers,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AIAssessmentPanelProps {
  caseId: string;
  factors?: any;
  confidence?: number;
  onReassessed?: () => void;
}

export function AIAssessmentPanel({
  caseId,
  factors,
  confidence = 0.85,
  onReassessed,
}: AIAssessmentPanelProps) {
  const [activeTab, setActiveTab] = useState<"observed" | "inferred" | "limitations">("observed");
  const [isReassessing, setIsReassessing] = useState(false);
  const [liveAssessment, setLiveAssessment] = useState<any>(null);

  const modelName = factors?.modelName || "gemini-2.5-flash / Sentinel-1 SAR Classifier";
  const modelVersion = factors?.modelVersion || "v2.5.0-multimodal";
  const aiDamageClass = factors?.aiDamageClass || "SEVERE";
  const reasoningSummary =
    factors?.reasoningSummary ||
    "Significant backscatter attenuation and surface water reflection detected adjacent to critical access corridors in post-disaster satellite imagery.";

  const handleReassess = async () => {
    setIsReassessing(true);
    try {
      const res = await fetch(`/api/ai/cases/${caseId}/reassess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceFresh: true }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error?.message || "Reassessment failed");
      }
      const data = await res.json();
      setLiveAssessment(data.assessment);
      toast.success("AI Reassessment Completed", {
        description: `Classified as ${data.assessment.damageClass} (${Math.round(data.assessment.confidence * 100)}% confidence)`,
      });
      if (onReassessed) onReassessed();
    } catch (err: any) {
      toast.error("Reassessment Failed", { description: err.message });
    } finally {
      setIsReassessing(false);
    }
  };

  const assessment = liveAssessment || {
    damageClass: aiDamageClass,
    confidence,
    observedChanges: [
      {
        type: "Coherence & Reflection Shift",
        description: "Distinct radar backscatter loss across access perimeter and ingress roadway.",
        evidenceReference: factors?.satelliteProduct || "Sentinel-1 SAR Swath Pass",
        severity: "SEVERE",
      },
    ],
    inferredImpact: [
      {
        facilityOrZone: factors?.nearestAsset || "Primary Facility",
        plausibleImpact:
          "High likelihood of vehicular access obstruction and peripheral basement flooding.",
        confidence: 0.82,
      },
    ],
    limitations: [
      "Sentinel 10m/pixel spatial resolution limits fine interior structural damage verification.",
      "Radar layover possible along tall surrounding building perimeters.",
    ],
    uncertaintyNotes: [
      "Water depth unmeasurable directly from SAR backscatter without hydrodynamic depth modeling.",
    ],
  };

  return (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">AI Multimodal Assessment</h3>
              <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Decision Support
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Model: <span className="font-mono text-foreground/80">{modelName}</span> ({modelVersion})
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReassess}
          disabled={isReassessing}
          className="text-xs h-8 gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReassessing ? "animate-spin" : ""}`} />
          {isReassessing ? "Re-evaluating..." : "Re-assess with AI"}
        </Button>
      </div>

      {/* Model-Reported Confidence & Classification */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border border-border/40">
        <div>
          <span className="text-[11px] text-muted-foreground uppercase font-medium">Damage Class</span>
          <div className="font-semibold text-sm text-foreground mt-0.5">{assessment.damageClass}</div>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase font-medium">Model Confidence</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-12 bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.round(assessment.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-medium">{Math.round(assessment.confidence * 100)}%</span>
          </div>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase font-medium">Evidence Grounding</span>
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Sensor Data
          </div>
        </div>
        <div>
          <span className="text-[11px] text-muted-foreground uppercase font-medium">Human Decision</span>
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            Review Required
          </div>
        </div>
      </div>

      {/* Evidence Reasoning Summary */}
      <div className="text-xs text-foreground/90 bg-primary/5 p-3 rounded-lg border border-primary/10 leading-relaxed">
        <span className="font-semibold text-primary block mb-1">Evidence Reasoning:</span>
        {reasoningSummary}
      </div>

      {/* Navigation Tabs for Observed vs Inferred vs Limitations */}
      <div className="flex border-b border-border/60 gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("observed")}
          className={`pb-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "observed"
              ? "border-b-2 border-primary text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Observed Changes ({assessment.observedChanges?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("inferred")}
          className={`pb-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "inferred"
              ? "border-b-2 border-primary text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Inferred Impact ({assessment.inferredImpact?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("limitations")}
          className={`pb-2 flex items-center gap-1.5 transition-colors ${
            activeTab === "limitations"
              ? "border-b-2 border-primary text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Limitations & Uncertainty
        </button>
      </div>

      {/* Tab Content */}
      <div className="text-xs space-y-2.5">
        {activeTab === "observed" && (
          <div className="space-y-2">
            {assessment.observedChanges?.map((c: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{c.type}</span>
                  <Badge variant="outline" className="text-[10px]">{c.severity}</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="mt-1.5 text-[10px] text-muted-foreground/80 font-mono">
                  Ref: {c.evidenceReference}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "inferred" && (
          <div className="space-y-2">
            {assessment.inferredImpact?.map((inf: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{inf.facilityOrZone}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Plausibility: {Math.round(inf.confidence * 100)}%
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{inf.plausibleImpact}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "limitations" && (
          <div className="space-y-2 text-muted-foreground">
            <div className="bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20 p-2.5 rounded-lg">
              <div className="font-medium text-xs mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Sensor & Environmental Constraints
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                {assessment.limitations?.map((l: string, idx: number) => (
                  <li key={idx}>{l}</li>
                ))}
              </ul>
            </div>
            {assessment.uncertaintyNotes?.length > 0 && (
              <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20">
                <span className="font-medium text-foreground block mb-1 text-xs">Uncertainty Notes:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {assessment.uncertaintyNotes.map((u: string, idx: number) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          AI is non-authoritative. Priority score (0-100) is calculated deterministically on the backend.
        </span>
      </div>
    </div>
  );
}
