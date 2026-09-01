import { z } from "zod";

export const DamageTaxonomyEnum = z.enum([
  "NO_SIGNIFICANT_DAMAGE",
  "MINOR",
  "MODERATE",
  "SEVERE",
  "DESTROYED",
  "UNCERTAIN"
]);

export const ObservedChangeSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(3),
  evidenceReference: z.string().min(1),
  severity: z.enum(["MINOR", "MODERATE", "SEVERE", "CRITICAL"]),
  locationDescription: z.string().optional()
});

export const InferredImpactSchema = z.object({
  facilityOrZone: z.string().min(1),
  plausibleImpact: z.string().min(3),
  confidence: z.number().min(0).max(1)
});

export const DamageAssessmentOutputSchema = z.object({
  damageClass: DamageTaxonomyEnum,
  confidence: z.number().min(0).max(1), // Model-reported confidence
  observedChanges: z.array(ObservedChangeSchema).default([]),
  inferredImpact: z.array(InferredImpactSchema).default([]),
  uncertaintyNotes: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  recommendedOperatorAction: z.string().min(3),
  reasoningSummary: z.string().min(5)
});

export type DamageAssessmentOutput = z.infer<typeof DamageAssessmentOutputSchema>;

export const EvidenceSummaryOutputSchema = z.object({
  summary: z.string().min(5),
  detectedFeatures: z.array(z.string()).default([]),
  changeIndicators: z.array(z.string()).default([]),
  uncertainty: z.array(z.string()).default([])
});

export type EvidenceSummaryOutput = z.infer<typeof EvidenceSummaryOutputSchema>;

export const ReportOutputSchema = z.object({
  title: z.string().min(3),
  incidentId: z.string().min(1),
  executiveSummary: z.string().min(10),
  keyFindings: z.array(z.string()).min(1),
  criticalInfrastructureStatus: z.array(z.object({
    assetName: z.string(),
    assetType: z.string(),
    damageStatus: z.string(),
    accessStatus: z.string()
  })).default([]),
  recommendedPriorities: z.array(z.string()).default([]),
  methodology: z.string().min(5)
});

export type ReportOutput = z.infer<typeof ReportOutputSchema>;
