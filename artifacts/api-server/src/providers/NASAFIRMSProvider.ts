import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { validateFirmsKey, fetchActiveFireHotspots } from "../lib/external-apis/nasa-firms";
import { logger } from "../lib/logger";

export class NASAFIRMSProvider implements DataProvider {
  public readonly id = "nasa-firms";
  public readonly name = "NASA FIRMS Fire & Thermal Anomaly System";
  public readonly type = "FIRE_HOTSPOTS";

  public async search(params: SearchParams): Promise<SearchResult> {
    const bbox = params.bbox || [68.0, 6.0, 98.0, 38.0]; // Default India bounding box
    const [west, south, east, north] = bbox;

    try {
      const hotspots = await fetchActiveFireHotspots({
        west,
        south,
        east,
        north,
        days: 1,
        sensor: "VIIRS_SNPP_NRT",
      });

      const items: EarthObservationItem[] = hotspots.map((h) => ({
        externalId: h.externalId,
        provider: "NASA_FIRMS",
        collection: "VIIRS_SNPP_NRT",
        platform: h.satellite,
        datetime: h.eventTime.toISOString(),
        geometry: h.location,
        bbox: [h.longitude, h.latitude, h.longitude, h.latitude],
        processingLevel: "NRT",
        assets: {},
        providerMetadata: {
          brightness: h.brightness,
          confidence: h.confidence,
          frp: h.frp,
          instrument: h.instrument,
          acqDate: h.acqDate,
          acqTime: h.acqTime,
        },
        qualityStatus: "READY",
        dataMode: "REAL",
      }));

      return {
        items,
        totalCount: items.length,
        sourceStatus: "HEALTHY",
        provider: "NASA_FIRMS",
      };
    } catch (err: any) {
      throw new ProviderError({
        code: "PROVIDER_UNAVAILABLE",
        message: err.message || "Failed to query NASA FIRMS",
        provider: "NASA_FIRMS",
      });
    }
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `NASA FIRMS does not support single-item lookup for ${externalId}`,
      provider: "NASA_FIRMS",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const validation = await validateFirmsKey();
    return {
      provider: this.id,
      name: this.name,
      type: this.type,
      configured: validation.configured,
      reachable: validation.status === "HEALTHY" || validation.status === "AUTH_ERROR",
      authenticated: validation.authenticated,
      latencyMs: validation.latencyMs,
      lastSuccess: validation.authenticated ? new Date().toISOString() : undefined,
      lastError: validation.error,
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "GLOBAL / INDIA",
      status: validation.status as any,
      checkedAt: new Date().toISOString(),
    };
  }
}

export const nasaFirmsProvider = new NASAFIRMSProvider();
