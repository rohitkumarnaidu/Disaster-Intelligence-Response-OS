import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { fetchSachetAlerts, SachetDisasterAlert } from "../lib/external-apis/sachet-alerts";

export class SACHETProvider implements DataProvider {
  public readonly id = "sachet-ndma";
  public readonly name = "SACHET (NDMA India National Disaster Alert Platform)";
  public readonly type = "CAP_ALERTS";

  public async search(_params: SearchParams): Promise<SearchResult> {
    try {
      const alerts = await fetchSachetAlerts();
      const items: EarthObservationItem[] = alerts.map((a) => ({
        externalId: a.alertId,
        provider: "SACHET_NDMA",
        collection: "CAP_ALERTS",
        platform: "NDMA_SACHET",
        datetime: a.effective.toISOString(),
        geometry: a.geometry || { type: "Point", coordinates: [78.9629, 20.5937] },
        bbox: [68.0, 6.0, 98.0, 38.0],
        processingLevel: "OFFICIAL_CAP",
        assets: {},
        providerMetadata: {
          headline: a.headline,
          severity: a.severity,
          urgency: a.urgency,
          certainty: a.certainty,
          areaDesc: a.areaDesc,
          sourceUrl: a.sourceUrl,
          rawHash: a.rawHash,
        },
        qualityStatus: "READY",
        dataMode: "REAL",
      }));

      return {
        items,
        totalCount: items.length,
        sourceStatus: "HEALTHY",
        provider: "SACHET_NDMA",
      };
    } catch (err: any) {
      throw new ProviderError({
        code: "PROVIDER_UNAVAILABLE",
        message: err.message || "Failed to query SACHET alert feed",
        provider: "SACHET_NDMA",
      });
    }
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: `Alert ${externalId} not found directly`,
      provider: "SACHET_NDMA",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      const url = process.env.SACHET_FEED_URL || "https://sachet.ndma.gov.in/cap_feed/rss.xml";
      const res = await fetch(url, { method: "HEAD", signal: controller.signal }).catch(() => null);
      clearTimeout(id);

      const latencyMs = Date.now() - start;
      const isReachable = res ? res.ok || res.status < 500 : false;

      return {
        provider: this.id,
        name: this.name,
        type: this.type,
        configured: true,
        reachable: isReachable,
        authenticated: true,
        latencyMs,
        lastSuccess: isReachable ? new Date().toISOString() : undefined,
        freshnessClass: "NEAR_REAL_TIME",
        coverage: "INDIA NATIONWIDE",
        status: isReachable ? "HEALTHY" : "DEGRADED",
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

export const sachetProvider = new SACHETProvider();
