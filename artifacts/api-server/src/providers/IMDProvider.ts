import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { fetchImdObservation } from "../lib/external-apis/imd-weather";

export class IMDProvider implements DataProvider {
  public readonly id = "imd-weather";
  public readonly name = "IMD (India Meteorological Department)";
  public readonly type = "METEOROLOGY";

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      totalCount: 0,
      sourceStatus: process.env.IMD_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      provider: "IMD_WEATHER",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `IMD item ${externalId} not found`,
      provider: "IMD_WEATHER",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const isConfigured = !!(process.env.IMD_API_KEY || process.env.IMD_API_BASE_URL);
    if (!isConfigured) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "INDIA NATIONWIDE",
        status: "NOT_CONFIGURED",
        checkedAt: new Date().toISOString(),
      };
    }

    const start = Date.now();
    try {
      const obs = await fetchImdObservation(13.08, 80.27);
      const latencyMs = Date.now() - start;
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        reachable: !!obs,
        authenticated: true,
        latencyMs,
        lastSuccess: obs ? new Date().toISOString() : undefined,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "INDIA NATIONWIDE",
        status: obs ? "HEALTHY" : "DEGRADED",
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        reachable: false,
        authenticated: false,
        latencyMs: Date.now() - start,
        lastError: err.message,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "INDIA NATIONWIDE",
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const imdProvider = new IMDProvider();
