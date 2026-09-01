import {
  AIProvider,
  AIProviderHealth,
  AssessmentInput,
  StructuredDamageAssessment,
  StructuredEvidenceSummary,
  StructuredReportOutput,
} from "./AIProvider";
import { PROMPTS } from "./prompts";
import crypto from "crypto";

export class MockVisionAssessmentProvider implements AIProvider {
  public readonly id = "mock-vision-baseline";
  public readonly name = "Baseline Remote Sensing Vision Engine";
  public readonly type = "MOCK_VISION";
  public readonly defaultModel = "draxelyra-cv-baseline-v2";
  public readonly modelVersion = "v2.4.0";

  public async assessDamage(input: AssessmentInput): Promise<StructuredDamageAssessment> {
    const startTime = Date.now();
    const isSAR = input.sensorType === "SAR" || (input.afterImage?.productId || "").includes("S1");
    const assetType = input.assetContext?.type || "Facility";
    const assetName = input.assetContext?.name || "Target Infrastructure";

    // Deterministic damage class determination based on asset & sensor context
    let damageClass: any = "MODERATE";
    let confidence = 0.82;
    let severity: any = "MODERATE";

    if (assetType.toLowerCase().includes("hospital") || assetType.toLowerCase().includes("emergency")) {
      damageClass = "SEVERE";
      severity = "SEVERE";
      confidence = isSAR ? 0.89 : 0.84;
    } else if (assetType.toLowerCase().includes("bridge")) {
      damageClass = "SEVERE";
      severity = "CRITICAL";
      confidence = 0.86;
    } else if (assetType.toLowerCase().includes("school")) {
      damageClass = "MODERATE";
      severity = "MODERATE";
      confidence = 0.79;
    }

    const inputString = JSON.stringify(input);
    const inputHash = crypto.createHash("sha256").update(inputString).digest("hex");

    const latencyMs = Date.now() - startTime + 45;

    return {
      damageClass,
      confidence,
      observedChanges: [
        {
          type: isSAR ? "SAR_BACKSCATTER_ANOMALY" : "OPTICAL_SPECTRAL_INDEX_SHIFT",
          description: isSAR
            ? `Distinct loss of radar coherence detected on Sentinel-1 SAR swath within 150m of ${assetName}. Indicates standing surface water and structure inundation.`
            : `Significant MNDWI/NDWI index elevation detected in post-event optical pass over ${assetName} compared to baseline.`,
          evidenceReference: input.afterImage?.productId || "S1A_IW_GRDH_POST_PASS",
          severity,
          locationDescription: `Centroid adjacent to ${assetName}`,
        },
      ],
      inferredImpact: [
        {
          facilityOrZone: assetName,
          plausibleImpact:
            damageClass === "SEVERE"
              ? "Access road submerged; primary ground transport vehicles may experience blockage without heavy high-clearance response units."
              : "Peripheral perimeter flooding with potential drainage overflow.",
          confidence: Math.min(confidence, 0.85),
        },
      ],
      uncertaintyNotes: [
        isSAR
          ? "SAR geometry subject to radar layover in high-density urban corridors."
          : "Optical scene contains cloud shadow artifacts on periphery of AOI.",
      ],
      limitations: [
        "Spatial resolution 10m/pixel (Sentinel constellation) - fine interior building inspection unavailable.",
      ],
      recommendedOperatorAction:
        damageClass === "SEVERE"
          ? "Dispatch Field Verification Team for immediate ingress route validation."
          : "Monitor ongoing satellite passes for recession trend.",
      reasoningSummary: `Deterministic baseline assessment computed ${damageClass} change signature with ${Math.round(confidence * 100)}% confidence grounded in ${isSAR ? "SAR radar coherence change" : "optical water index difference"}.`,
      metadata: {
        provider: this.id,
        model: this.defaultModel,
        modelVersion: this.modelVersion,
        promptVersion: PROMPTS.damage_assessment_v1.version,
        schemaVersion: PROMPTS.damage_assessment_v1.schemaVersion,
        inputHash,
        outputHash: crypto.createHash("sha256").update(damageClass + confidence).digest("hex"),
        latencyMs,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        timestamp: new Date().toISOString(),
      },
    };
  }

  public async summarizeEvidence(input: AssessmentInput): Promise<StructuredEvidenceSummary> {
    const startTime = Date.now();
    return {
      summary: `Verified satellite baseline change analysis for incident ${input.incidentId}. High-confidence backscatter attenuation near critical asset.`,
      detectedFeatures: ["Flooded Ingress Corridor", "Surface Water Accumulation"],
      changeIndicators: ["Radar Backscatter Loss", "Coherence Drop"],
      uncertainty: ["Speckle noise in urban core"],
      metadata: {
        provider: this.id,
        model: this.defaultModel,
        promptVersion: PROMPTS.evidence_summary_v1.version,
        latencyMs: Date.now() - startTime + 20,
      },
    };
  }

  public async generateReport(incidentContext: any, verifiedCases: any[]): Promise<StructuredReportOutput> {
    return {
      title: `Operational Disaster Assessment Report: ${incidentContext?.name || "Incident"}`,
      incidentId: incidentContext?.id || "INC-CURRENT",
      executiveSummary: `Post-disaster multi-source assessment identifies ${verifiedCases.length} confirmed priority impact zones requiring coordinate response.`,
      keyFindings: [
        `${verifiedCases.length} critical facilities evaluated across the operational AOI.`,
        "Flood inundation predominantly impacting low-lying transportation arterials.",
      ],
      criticalInfrastructureStatus: verifiedCases.slice(0, 5).map((c) => ({
        assetName: c.assetName || "Facility",
        assetType: c.assetType || "General",
        damageStatus: c.severity || "MODERATE",
        accessStatus: "Constrained",
      })),
      recommendedPriorities: [
        "Deploy mobile barrier systems to primary medical hubs.",
        "Establish secondary emergency access staging lines.",
      ],
      methodology: "Baseline deterministic change extraction and spatial buffering against OpenStreetMap assets.",
      metadata: {
        provider: this.id,
        model: this.defaultModel,
        promptVersion: PROMPTS.report_generation_v1.version,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  public async healthCheck(): Promise<AIProviderHealth> {
    return {
      provider: this.id,
      name: this.name,
      type: this.type,
      configured: true,
      authenticated: true,
      reachable: true,
      latencyMs: 1,
      model: this.defaultModel,
      version: this.modelVersion,
      status: "READY",
      checkedAt: new Date().toISOString(),
    };
  }
}
