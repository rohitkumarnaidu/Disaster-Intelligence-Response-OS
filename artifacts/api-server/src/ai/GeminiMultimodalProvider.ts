import {
  AIProvider,
  AIProviderHealth,
  AssessmentInput,
  StructuredDamageAssessment,
  StructuredEvidenceSummary,
  StructuredReportOutput,
} from "./AIProvider";
import { PROMPTS } from "./prompts";
import {
  DamageAssessmentOutputSchema,
  EvidenceSummaryOutputSchema,
  ReportOutputSchema,
} from "./schemas/damage-assessment";
import { InputSanitizer } from "./security/sanitizer";
import { logger } from "../lib/logger";
import crypto from "crypto";

export class GeminiMultimodalProvider implements AIProvider {
  public readonly id = "gemini-multimodal";
  public readonly name = "Google Gemini Multimodal AI Provider";
  public readonly type = "GEMINI_MULTIMODAL";
  public readonly defaultModel: string;
  public readonly modelVersion = "gemini-2.5-flash-preview";

  private apiKey: string | null = null;
  private isConfigured = false;
  private client: any = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    this.isConfigured = !!this.apiKey && this.apiKey.trim().length > 0;

    if (this.isConfigured) {
      try {
        // Dynamically initialize @google/genai client if key is present
        import("@google/genai").then(({ GoogleGenAI }) => {
          this.client = new GoogleGenAI({ apiKey: this.apiKey! });
        }).catch((err) => {
          logger.warn({ err }, "Could not load @google/genai SDK dynamically");
        });
      } catch (err) {
        logger.warn({ err }, "Failed to initialize Gemini client");
      }
    }
  }

  public async assessDamage(input: AssessmentInput): Promise<StructuredDamageAssessment> {
    if (!this.isConfigured || !this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server. Configure GEMINI_API_KEY to enable Real AI inference.");
    }

    const startTime = Date.now();
    const promptTemplate = PROMPTS.damage_assessment_v1;
    const systemInstruction = promptTemplate.systemInstruction;
    const userPrompt = promptTemplate.renderUserPrompt(input);

    const inputString = JSON.stringify(input) + userPrompt;
    const inputHash = crypto.createHash("sha256").update(inputString).digest("hex");

    // Prepare multimodal parts
    const parts: any[] = [{ text: userPrompt }];

    if (input.beforeImage?.base64) {
      parts.push({
        inlineData: {
          mimeType: input.beforeImage.mimeType || "image/jpeg",
          data: input.beforeImage.base64,
        },
      });
    }

    if (input.afterImage?.base64) {
      parts.push({
        inlineData: {
          mimeType: input.afterImage.mimeType || "image/jpeg",
          data: input.afterImage.base64,
        },
      });
    }

    try {
      let rawJsonText = "";
      let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      // Ensure client is instantiated
      if (!this.client) {
        const { GoogleGenAI } = await import("@google/genai");
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      }

      const response = await this.client.models.generateContent({
        model: this.defaultModel,
        contents: parts,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      });

      rawJsonText = response.text || "{}";
      if (response.usageMetadata) {
        tokenUsage = {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        };
      }

      const parsed = JSON.parse(rawJsonText);
      const validated = DamageAssessmentOutputSchema.parse(parsed);

      const latencyMs = Date.now() - startTime;
      const outputHash = crypto.createHash("sha256").update(rawJsonText).digest("hex");

      return {
        damageClass: validated.damageClass,
        confidence: validated.confidence,
        observedChanges: validated.observedChanges,
        inferredImpact: validated.inferredImpact,
        uncertaintyNotes: validated.uncertaintyNotes,
        limitations: validated.limitations,
        recommendedOperatorAction: validated.recommendedOperatorAction,
        reasoningSummary: validated.reasoningSummary,
        metadata: {
          provider: this.id,
          model: this.defaultModel,
          modelVersion: this.modelVersion,
          promptVersion: promptTemplate.version,
          schemaVersion: promptTemplate.schemaVersion,
          inputHash,
          outputHash,
          latencyMs,
          tokenUsage,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      logger.error({ err, provider: this.id }, "Gemini damage assessment failed");
      throw new Error(`Gemini Multimodal Inference Failed: ${err.message}`);
    }
  }

  public async summarizeEvidence(input: AssessmentInput): Promise<StructuredEvidenceSummary> {
    if (!this.isConfigured || !this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const startTime = Date.now();
    const promptTemplate = PROMPTS.evidence_summary_v1;

    if (!this.client) {
      const { GoogleGenAI } = await import("@google/genai");
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const response = await this.client.models.generateContent({
      model: this.defaultModel,
      contents: [{ text: promptTemplate.renderUserPrompt(input) }],
      config: {
        systemInstruction: promptTemplate.systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const validated = EvidenceSummaryOutputSchema.parse(parsed);

    return {
      summary: validated.summary,
      detectedFeatures: validated.detectedFeatures,
      changeIndicators: validated.changeIndicators,
      uncertainty: validated.uncertainty,
      metadata: {
        provider: this.id,
        model: this.defaultModel,
        promptVersion: promptTemplate.version,
        latencyMs: Date.now() - startTime,
      },
    };
  }

  public async generateReport(incidentContext: any, verifiedCases: any[]): Promise<StructuredReportOutput> {
    if (!this.isConfigured || !this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const promptTemplate = PROMPTS.report_generation_v1;

    if (!this.client) {
      const { GoogleGenAI } = await import("@google/genai");
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    const response = await this.client.models.generateContent({
      model: this.defaultModel,
      contents: [{ text: promptTemplate.renderUserPrompt({ incident: incidentContext, cases: verifiedCases, tasks: [] }) }],
      config: {
        systemInstruction: promptTemplate.systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const validated = ReportOutputSchema.parse(parsed);

    return {
      title: validated.title,
      incidentId: validated.incidentId,
      executiveSummary: validated.executiveSummary,
      keyFindings: validated.keyFindings,
      criticalInfrastructureStatus: validated.criticalInfrastructureStatus,
      recommendedPriorities: validated.recommendedPriorities,
      methodology: validated.methodology,
      metadata: {
        provider: this.id,
        model: this.defaultModel,
        promptVersion: promptTemplate.version,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  public async healthCheck(): Promise<AIProviderHealth> {
    const startTime = Date.now();

    if (!this.isConfigured || !this.apiKey) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: false,
        authenticated: false,
        reachable: false,
        latencyMs: 0,
        model: this.defaultModel,
        version: this.modelVersion,
        lastError: "GEMINI_API_KEY environment variable is not set.",
        status: "NOT_CONFIGURED",
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      if (!this.client) {
        const { GoogleGenAI } = await import("@google/genai");
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      }

      // Perform a lightweight probe (generate 1 token test)
      const res = await this.client.models.generateContent({
        model: this.defaultModel,
        contents: [{ text: "Ping" }],
        config: { maxOutputTokens: 1 },
      });

      const latencyMs = Date.now() - startTime;
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        authenticated: true,
        reachable: true,
        latencyMs,
        model: this.defaultModel,
        version: this.modelVersion,
        lastSuccess: new Date().toISOString(),
        status: "READY",
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        authenticated: false,
        reachable: false,
        latencyMs: Date.now() - startTime,
        model: this.defaultModel,
        version: this.modelVersion,
        lastError: err.message,
        status: err.status === 401 || err.status === 403 ? "AUTH_ERROR" : "ERROR",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}
