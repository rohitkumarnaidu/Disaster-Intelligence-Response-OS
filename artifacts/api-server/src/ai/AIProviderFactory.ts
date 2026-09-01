import { AIProvider, AIProviderHealth } from "./AIProvider";
import { MockVisionAssessmentProvider } from "./MockVisionAssessmentProvider";
import { GeminiMultimodalProvider } from "./GeminiMultimodalProvider";
import { logger } from "../lib/logger";

export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<string, AIProvider> = new Map();

  private constructor() {
    // Register standard providers
    const mockProvider = new MockVisionAssessmentProvider();
    const geminiProvider = new GeminiMultimodalProvider();

    this.providers.set(mockProvider.id, mockProvider);
    this.providers.set(geminiProvider.id, geminiProvider);
  }

  public static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  public getProvider(id?: string): AIProvider {
    if (id && this.providers.has(id)) {
      return this.providers.get(id)!;
    }

    // Default selection logic:
    // If explicit GEMINI requested and configured, use Gemini
    const defaultPref = process.env.AI_PROVIDER_DEFAULT || "gemini-multimodal";
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;

    if (defaultPref === "gemini-multimodal" && hasGeminiKey) {
      return this.providers.get("gemini-multimodal")!;
    }

    // Otherwise return deterministic MockVisionAssessmentProvider baseline
    return this.providers.get("mock-vision-baseline")!;
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public async getAllProviderHealth(): Promise<AIProviderHealth[]> {
    const results: AIProviderHealth[] = [];
    for (const provider of this.providers.values()) {
      try {
        const health = await provider.healthCheck();
        results.push(health);
      } catch (err: any) {
        results.push({
          provider: provider.id,
          name: provider.name,
          type: provider.type,
          configured: false,
          authenticated: false,
          reachable: false,
          latencyMs: 0,
          model: provider.defaultModel,
          version: provider.modelVersion,
          lastError: err.message,
          status: "ERROR",
          checkedAt: new Date().toISOString(),
        });
      }
    }
    return results;
  }
}

export const aiProviderFactory = AIProviderFactory.getInstance();
