import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { GeminiMultimodalProvider } from "../ai/GeminiMultimodalProvider";

export class GeminiProvider implements DataProvider {
  public readonly id = "gemini-multimodal";
  public readonly name = "Google Gemini Multimodal AI Provider";
  public readonly type = "MULTIMODAL_AI";
  private geminiCore = new GeminiMultimodalProvider();

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      totalCount: 0,
      sourceStatus: process.env.GEMINI_API_KEY ? "HEALTHY" : "NOT_CONFIGURED",
      provider: "GEMINI_MULTIMODAL",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `Gemini assessment model ${externalId} is an inference service`,
      provider: "GEMINI_MULTIMODAL",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const aiHealth = await this.geminiCore.healthCheck();
    return {
      provider: this.id,
      name: this.name,
      type: this.type,
      configured: aiHealth.configured,
      reachable: aiHealth.reachable,
      authenticated: aiHealth.authenticated,
      latencyMs: aiHealth.latencyMs,
      lastSuccess: aiHealth.lastSuccess,
      lastError: aiHealth.lastError,
      freshnessClass: "LIVE",
      coverage: "GLOBAL / MULTIMODAL INFERENCE",
      status: aiHealth.status === "READY" ? "HEALTHY" : (aiHealth.status as any),
      checkedAt: aiHealth.checkedAt,
    };
  }
}

export const geminiProvider = new GeminiProvider();
