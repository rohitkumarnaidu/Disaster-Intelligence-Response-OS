import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { fetchAirQuality } from "../lib/external-apis/waqi-air-quality";

export class WAQIProvider implements DataProvider {
  public readonly id = "waqi-air-quality";
  public readonly name = "World Air Quality Index (WAQI Ground Stations)";
  public readonly type = "ENVIRONMENTAL_AQI";

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      totalCount: 0,
      sourceStatus: "HEALTHY",
      provider: "WAQI",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `AQI station ${externalId} not found`,
      provider: "WAQI",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const isConfigured = !!process.env.WAQI_API_TOKEN;
    const start = Date.now();

    try {
      const aqi = await fetchAirQuality(13.08, 80.27);
      const latencyMs = Date.now() - start;

      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: !!aqi,
        authenticated: isConfigured,
        latencyMs,
        lastSuccess: aqi ? new Date().toISOString() : undefined,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "GLOBAL / GROUND STATIONS",
        status: aqi ? "HEALTHY" : "DEGRADED",
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
        coverage: "GLOBAL / GROUND STATIONS",
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const waqiProvider = new WAQIProvider();
