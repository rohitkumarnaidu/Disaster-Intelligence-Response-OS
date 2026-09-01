export type DamageTaxonomy =
  | "NO_SIGNIFICANT_DAMAGE"
  | "MINOR"
  | "MODERATE"
  | "SEVERE"
  | "DESTROYED"
  | "UNCERTAIN";

export type AIProviderType = "GEMINI_MULTIMODAL" | "MOCK_VISION" | "PYTORCH_VISION" | "EXTERNAL";

export type AITaskType =
  | "DAMAGE_ASSESSMENT"
  | "EVIDENCE_SUMMARY"
  | "OPERATOR_BRIEF"
  | "REPORT_GENERATION";

export type AIStatus =
  | "READY"
  | "NOT_CONFIGURED"
  | "PROCESSING"
  | "DEGRADED"
  | "AUTH_ERROR"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "ERROR";

export interface AIProviderHealth {
  provider: string;
  name: string;
  type: AIProviderType;
  configured: boolean;
  authenticated: boolean;
  reachable: boolean;
  latencyMs: number;
  model: string;
  version: string;
  lastSuccess?: string;
  lastError?: string;
  status: AIStatus;
  checkedAt: string;
}

export interface AssessmentImageInput {
  url?: string;
  base64?: string;
  mimeType?: string;
  checksum?: string;
  description?: string;
  productId?: string;
}

export interface AssessmentInput {
  incidentId: string;
  caseId?: string;
  aoi?: any;
  assetContext?: {
    name: string;
    type: string;
    criticalityScore?: number;
    populationExposureTier?: string;
    latitude?: number;
    longitude?: number;
  };
  beforeImage?: AssessmentImageInput;
  afterImage?: AssessmentImageInput;
  sensorType?: "SAR" | "OPTICAL" | "DRONE" | "AERIAL";
  metadata?: Record<string, any>;
  promptVersion?: string;
}

export interface ObservedChange {
  type: string;
  description: string;
  evidenceReference: string;
  severity: "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
  locationDescription?: string;
}

export interface InferredImpact {
  facilityOrZone: string;
  plausibleImpact: string;
  confidence: number;
}

export interface StructuredDamageAssessment {
  damageClass: DamageTaxonomy;
  confidence: number; // Model-reported confidence [0.0 - 1.0]
  observedChanges: ObservedChange[];
  inferredImpact: InferredImpact[];
  uncertaintyNotes: string[];
  limitations: string[];
  recommendedOperatorAction: string;
  reasoningSummary: string; // Evidence-grounded explanation
  metadata: {
    provider: string;
    model: string;
    modelVersion: string;
    promptVersion: string;
    schemaVersion: string;
    inputHash: string;
    outputHash?: string;
    latencyMs: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    cached?: boolean;
    timestamp: string;
  };
}

export interface StructuredEvidenceSummary {
  summary: string;
  detectedFeatures: string[];
  changeIndicators: string[];
  uncertainty: string[];
  metadata: {
    provider: string;
    model: string;
    promptVersion: string;
    latencyMs: number;
  };
}

export interface StructuredReportOutput {
  title: string;
  incidentId: string;
  executiveSummary: string;
  keyFindings: string[];
  criticalInfrastructureStatus: Array<{
    assetName: string;
    assetType: string;
    damageStatus: string;
    accessStatus: string;
  }>;
  recommendedPriorities: string[];
  methodology: string;
  metadata: {
    provider: string;
    model: string;
    promptVersion: string;
    generatedAt: string;
  };
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: AIProviderType;
  readonly defaultModel: string;
  readonly modelVersion: string;

  assessDamage(input: AssessmentInput): Promise<StructuredDamageAssessment>;
  summarizeEvidence(input: AssessmentInput): Promise<StructuredEvidenceSummary>;
  generateReport(incidentContext: any, verifiedCases: any[]): Promise<StructuredReportOutput>;
  healthCheck(): Promise<AIProviderHealth>;
}
