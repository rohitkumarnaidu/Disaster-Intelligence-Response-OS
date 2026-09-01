import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { fetchCurrentWeather } from "../lib/external-apis/openweathermap";

export class OpenWeatherProvider implements DataProvider {
  public readonly id = "openweathermap";
  public readonly name = "OpenWeatherMap Telemetry (with Open-Meteo Fallback)";
  public readonly type = "METEOROLOGY";

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      totalCount: 0,
      sourceStatus: "HEALTHY",
      provider: "OPENWEATHERMAP",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `Weather metadata ${externalId} not found`,
      provider: "OPENWEATHERMAP",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const isConfigured = !!process.env.OPENWEATHERMAP_API_KEY;
    const start = Date.now();

    try {
      // Test query for Chennai / India center coordinates
      const weather = await fetchCurrentWeather(13.08, 80.27);
      const latencyMs = Date.now() - start;

      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: !!weather,
        authenticated: isConfigured,
        latencyMs,
        lastSuccess: weather ? new Date().toISOString() : undefined,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "GLOBAL / INDIA",
        status: weather ? "HEALTHY" : "DEGRADED",
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: false,
        authenticated: false,
        latencyMs: Date.now() - start,
        lastError: err.message,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "GLOBAL / INDIA",
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const openWeatherProvider = new OpenWeatherProvider();
