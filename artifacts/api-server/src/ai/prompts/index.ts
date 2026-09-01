import { InputSanitizer } from "../security/sanitizer";
import { AssessmentInput } from "../AIProvider";

export interface PromptTemplate {
  name: string;
  version: string;
  schemaVersion: string;
  systemInstruction: string;
  renderUserPrompt(context: any): string;
}

export const PROMPTS: Record<string, PromptTemplate> = {
  damage_assessment_v1: {
    name: "damage_assessment",
    version: "damage_assessment_v1.0",
    schemaVersion: "zod_v1",
    systemInstruction: `You are the DRAXELYRA Disaster Intelligence Multimodal Damage Assessment Engine.
Your role is to analyze pre- and post-disaster remote sensing imagery (optical satellite, SAR radar, or aerial photography) alongside critical infrastructure context.

CRITICAL INSTRUCTIONS & SAFETY BOUNDARIES:
1. Ground every claim in observable visual evidence from the imagery.
2. EXPLICITLY SEPARATE:
   - "observedChanges": Physical alterations directly visible in the after-event imagery vs before-event baseline.
   - "inferredImpact": Plausible functional impact on surrounding infrastructure or operations based on proximity and severity.
3. If the imagery is blurry, cloudy, or ambiguous, assign damageClass: "UNCERTAIN", lower the confidence, and list the limitations in "limitations" and "uncertaintyNotes".
4. Allowed damageClass enums: "NO_SIGNIFICANT_DAMAGE", "MINOR", "MODERATE", "SEVERE", "DESTROYED", "UNCERTAIN".
5. Confidence MUST be a number between 0.00 and 1.00 reflecting your visual clarity and certainty.
6. DO NOT invent casualties, personnel counts, or structural certifications.
7. Output valid JSON strictly conforming to the requested schema.`,
    renderUserPrompt(input: AssessmentInput): string {
      const sanitizedAsset = input.assetContext
        ? `\nTarget Critical Infrastructure:
- Name: ${InputSanitizer.sanitizeText(input.assetContext.name, 100)}
- Type: ${InputSanitizer.sanitizeText(input.assetContext.type, 50)}
- Exposure Tier: ${InputSanitizer.sanitizeText(input.assetContext.populationExposureTier, 50)}`
        : "";

      const sanitizedMeta = input.metadata
        ? `\nSensor & Environmental Context:\n${JSON.stringify(InputSanitizer.sanitizeMetadata(input.metadata), null, 2)}`
        : "";

      return `Analyze the provided Before and After disaster imagery for Incident ID: ${InputSanitizer.sanitizeText(input.incidentId, 50)}.${sanitizedAsset}${sanitizedMeta}

Evaluate:
1. Observable change in structural geometry, surface reflectance, or flood inundation footprint.
2. Proximity of detected damage to the target critical infrastructure.
3. Level of uncertainty due to cloud cover, resolution limits, or sensor angle.
4. Recommended actionable operator focus.`;
    }
  },

  evidence_summary_v1: {
    name: "evidence_summary",
    version: "evidence_summary_v1.0",
    schemaVersion: "zod_v1",
    systemInstruction: `You are the DRAXELYRA Evidence Summarization Assistant.
Your task is to summarize photographic or sensor evidence collected during disaster response operations into concise, verifiable technical notes for emergency dispatchers.

Do not extrapolate beyond the submitted evidence. Note any lack of clarity or temporal uncertainty. Output valid JSON.`,
    renderUserPrompt(input: any): string {
      return `Summarize the attached evidence for Case ID: ${InputSanitizer.sanitizeText(input.caseId, 50)}.
Context notes: ${InputSanitizer.sanitizeText(input.notes, 500)}
Location: ${JSON.stringify(InputSanitizer.sanitizeMetadata(input.location))}`;
    }
  },

  report_generation_v1: {
    name: "report_generation",
    version: "report_generation_v1.0",
    schemaVersion: "zod_v1",
    systemInstruction: `You are the DRAXELYRA Situation Report Assistant.
Generate a structured Incident Situation & Assessment Report based strictly on verified cases, critical infrastructure impacts, and recorded response outcomes.

DO NOT invent unverified events or emergency actions. Rely only on the provided verified incident facts. Output valid JSON.`,
    renderUserPrompt(input: { incident: any; cases: any[]; tasks: any[] }): string {
      return `Generate an Operational Situation Report for:
Incident: ${InputSanitizer.sanitizeText(input.incident?.name, 100)} (Type: ${InputSanitizer.sanitizeText(input.incident?.disasterType, 50)})
Verified Impacted Cases Count: ${input.cases?.length || 0}
Verified Tasks Dispatched: ${input.tasks?.length || 0}

Verified Cases Data:
${JSON.stringify((input.cases || []).slice(0, 15), null, 2)}`;
    }
  }
};
