import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";

export class MapTilerProvider implements DataProvider {
  public readonly id = "maptiler";
  public readonly name = "MapTiler Cloud Basemaps & Satellite Tiles";
  public readonly type = "GIS_TILES";

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      totalCount: 0,
      sourceStatus: process.env.MAPTILER_API_KEY ? "HEALTHY" : "NOT_CONFIGURED",
      provider: "MAPTILER",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `MapTiler style metadata for ${externalId} not found`,
      provider: "MAPTILER",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const key = process.env.MAPTILER_API_KEY;
    if (!key) {
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        freshnessClass: "PERIODIC",
        coverage: "GLOBAL / HIGH RES",
        status: "NOT_CONFIGURED",
        checkedAt: new Date().toISOString(),
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
      const testUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
      const res = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(id);
      const latencyMs = Date.now() - start;

      if (res.status === 401 || res.status === 403) {
        return {
          provider: this.id,
          name: this.name,
          type: this.type,
          configured: true,
          reachable: true,
          authenticated: false,
          latencyMs,
          lastError: `MapTiler API key returned HTTP ${res.status}`,
          freshnessClass: "PERIODIC",
          coverage: "GLOBAL / HIGH RES",
          status: "AUTH_ERROR",
          checkedAt: new Date().toISOString(),
        };
      }

      const isValid = res.ok;
      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        reachable: isValid,
        authenticated: isValid,
        latencyMs,
        lastSuccess: isValid ? new Date().toISOString() : undefined,
        freshnessClass: "PERIODIC",
        coverage: "GLOBAL / HIGH RES",
        status: isValid ? "HEALTHY" : "DEGRADED",
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
        freshnessClass: "PERIODIC",
        coverage: "GLOBAL / HIGH RES",
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const mapTilerProvider = new MapTilerProvider();
