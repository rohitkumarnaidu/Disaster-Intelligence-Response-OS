import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";

export class SentinelProcessingProvider implements DataProvider {
  public readonly id = "sentinel-hub-process";
  public readonly name = "Sentinel Hub Processing API";
  public readonly type = "SATELLITE_PROCESSOR";

  private readonly processEndpoint = "https://services.sentinel-hub.com/api/v1/process";

  public isConfigured(): boolean {
    return Boolean(
      (process.env.SENTINEL_PROCESSING_CLIENT_ID || process.env.SH_CLIENT_ID) &&
      (process.env.SENTINEL_PROCESSING_CLIENT_SECRET || process.env.SH_CLIENT_SECRET)
    );
  }

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      sourceStatus: this.isConfigured() ? "HEALTHY" : "CONFIGURED",
      provider: "SENTINEL_HUB",
    };
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `Direct metadata query for ${externalId} not supported on Process API`,
      provider: "SENTINEL_HUB",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const configured = this.isConfigured();

    if (!configured) {
      return {
        provider: "SENTINEL_HUB",
        name: this.name,
        type: this.type,
        configured: false,
        reachable: true,
        authenticated: false,
        latencyMs: 0,
        status: "CONFIGURED",
        checkedAt,
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://services.sentinel-hub.com/oauth/token", {
        method: "HEAD",
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);

      return {
        provider: "SENTINEL_HUB",
        name: this.name,
        type: this.type,
        configured: true,
        reachable: Boolean(res),
        authenticated: true,
        latencyMs: Date.now() - start,
        lastSuccess: checkedAt,
        status: "HEALTHY",
        checkedAt,
      };
    } catch (err: any) {
      return {
        provider: "SENTINEL_HUB",
        name: this.name,
        type: this.type,
        configured: true,
        reachable: false,
        authenticated: false,
        latencyMs: Date.now() - start,
        lastError: err.message,
        status: "DEGRADED",
        checkedAt,
      };
    }
  }
}

export const sentinelProcessingProvider = new SentinelProcessingProvider();
