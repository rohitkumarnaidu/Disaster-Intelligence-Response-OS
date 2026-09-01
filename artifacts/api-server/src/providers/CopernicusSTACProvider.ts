import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
  QualityStatus,
} from "./DataProvider";
import { copernicusAuthService } from "../services/copernicus-auth";
import { logger } from "../lib/logger";

export class CopernicusSTACProvider implements DataProvider {
  public readonly id = "copernicus-stac";
  public readonly name = "Copernicus Data Space Ecosystem (STAC)";
  public readonly type = "SATELLITE_CATALOG";

  private readonly stacEndpoint = "https://stac.dataspace.copernicus.eu/v1";
  private readonly searchEndpoint = "https://stac.dataspace.copernicus.eu/v1/search";

  public async search(params: SearchParams): Promise<SearchResult> {
    const startTime = Date.now();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/geo+json, application/json",
    };

    // If credentials are configured, attach token
    if (copernicusAuthService.isConfigured()) {
      try {
        const token = await copernicusAuthService.getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (err) {
        logger.warn({ err }, "Proceeding with public STAC catalog search without bearer token");
      }
    }

    const collection = params.collection || "sentinel-1-grd";
    const bodyPayload: Record<string, any> = {
      collections: [collection],
      limit: Math.min(params.limit || 20, 50),
    };

    if (params.aoi) {
      bodyPayload.intersects = params.aoi;
    } else if (params.bbox) {
      bodyPayload.bbox = params.bbox;
    }

    if (params.startDate && params.endDate) {
      bodyPayload.datetime = `${new Date(params.startDate).toISOString()}/${new Date(params.endDate).toISOString()}`;
    } else if (params.startDate) {
      bodyPayload.datetime = `${new Date(params.startDate).toISOString()}/..`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(this.searchEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (response.status === 401 || response.status === 403) {
          throw new ProviderError({
            code: "PROVIDER_AUTH_FAILED",
            message: `Copernicus STAC authorization error (${response.status})`,
            provider: "COPERNICUS_STAC",
            statusCode: response.status,
          });
        }
        if (response.status === 429) {
          throw new ProviderError({
            code: "PROVIDER_RATE_LIMITED",
            message: "Copernicus STAC rate limit exceeded. Please wait before retrying.",
            provider: "COPERNICUS_STAC",
            statusCode: response.status,
            retryable: true,
          });
        }
        throw new ProviderError({
          code: "PROVIDER_UNAVAILABLE",
          message: `Copernicus STAC error (${response.status}): ${errText.slice(0, 150)}`,
          provider: "COPERNICUS_STAC",
          statusCode: response.status,
          retryable: true,
        });
      }

      const stacGeoJson: any = await response.json();
      const features: any[] = stacGeoJson.features || [];

      const normalizedItems: EarthObservationItem[] = features.map((feat) => {
        const props = feat.properties || {};
        const externalId = feat.id || props.id || `stac-${Date.now()}`;
        const cloudCover = typeof props["eo:cloud_cover"] === "number" ? props["eo:cloud_cover"] : props.cloudCover;
        const platform = props.platform || props["sat:platform_international_designator"] || props.constellation || "Sentinel";
        const datetime = props.datetime || props.start_datetime || new Date().toISOString();
        const polarization = props["sar:polarizations"] || (props.polarization ? [props.polarization] : undefined);
        const orbit = props["sat:orbit_state"] ? props["sat:orbit_state"].toUpperCase() : undefined;
        const processingLevel = props["processing:level"] || props.processingLevel || "LEVEL1";

        let qualityStatus: QualityStatus = "READY";
        if (collection.toLowerCase().includes("sentinel-2") && typeof cloudCover === "number" && cloudCover > 40) {
          qualityStatus = "UNSUITABLE_FOR_OPTICAL_ASSESSMENT";
        }

        const assets: Record<string, { href: string; type?: string; title?: string }> = {};
        if (feat.assets) {
          for (const [key, assetObj] of Object.entries<any>(feat.assets)) {
            assets[key] = {
              href: assetObj.href,
              type: assetObj.type,
              title: assetObj.title,
            };
          }
        }

        const bbox: [number, number, number, number] = feat.bbox || [0, 0, 0, 0];

        return {
          externalId,
          provider: "COPERNICUS_STAC",
          collection,
          platform,
          datetime,
          startDatetime: props.start_datetime,
          endDatetime: props.end_datetime,
          geometry: feat.geometry || { type: "Polygon", coordinates: [] },
          bbox,
          cloudCover,
          processingLevel,
          polarization,
          orbit,
          assets,
          providerMetadata: props,
          qualityStatus,
          dataMode: "REAL",
          catalogUrl: `https://browser.dataspace.copernicus.eu/?id=${encodeURIComponent(externalId)}`,
          sourceUrl: this.searchEndpoint,
          thumbnailUrl: feat.assets?.thumbnail?.href || feat.assets?.overview?.href,
        };
      });

      return {
        items: normalizedItems,
        nextCursor: stacGeoJson.links?.find((l: any) => l.rel === "next")?.href,
        totalCount: stacGeoJson.context?.matched || normalizedItems.length,
        sourceStatus: "HEALTHY",
        provider: "COPERNICUS_STAC",
      };
    } catch (err: any) {
      if (err instanceof ProviderError) throw err;
      logger.error({ err }, "Copernicus STAC catalog search failed");
      throw new ProviderError({
        code: err.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE",
        message: err.message || "Failed to reach Copernicus STAC catalog service",
        provider: "COPERNICUS_STAC",
        retryable: true,
        cause: err,
      });
    }
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    const itemUrl = `${this.stacEndpoint}/collections/sentinel-1-grd/items/${encodeURIComponent(externalId)}`;
    const headers: Record<string, string> = { Accept: "application/geo+json, application/json" };

    if (copernicusAuthService.isConfigured()) {
      const token = await copernicusAuthService.getAccessToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(itemUrl, { headers });
    if (!response.ok) {
      throw new ProviderError({
        code: response.status === 404 ? "PROVIDER_NOT_FOUND" : "PROVIDER_UNAVAILABLE",
        message: `STAC item ${externalId} not found (${response.status})`,
        provider: "COPERNICUS_STAC",
        statusCode: response.status,
      });
    }

    const feat: any = await response.json();
    const props = feat.properties || {};
    return {
      externalId: feat.id,
      provider: "COPERNICUS_STAC",
      collection: feat.collection || "sentinel-1-grd",
      platform: props.platform || "Sentinel-1",
      datetime: props.datetime || new Date().toISOString(),
      geometry: feat.geometry,
      bbox: feat.bbox || [0, 0, 0, 0],
      cloudCover: props["eo:cloud_cover"],
      processingLevel: props["processing:level"] || "LEVEL1",
      assets: feat.assets || {},
      providerMetadata: props,
      qualityStatus: "READY",
      dataMode: "REAL",
    };
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    const checkedAt = new Date().toISOString();
    const isConfigured = copernicusAuthService.isConfigured();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(this.stacEndpoint, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          provider: "COPERNICUS_STAC",
          name: this.name,
          type: this.type,
          configured: isConfigured,
          reachable: false,
          authenticated: false,
          latencyMs,
          lastError: `HTTP status ${res.status}`,
          status: "DEGRADED",
          checkedAt,
        };
      }

      let authenticated = false;
      if (isConfigured) {
        const token = await copernicusAuthService.getAccessToken().catch(() => null);
        authenticated = Boolean(token);
      }

      return {
        provider: "COPERNICUS_STAC",
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: true,
        authenticated: isConfigured ? authenticated : true,
        latencyMs,
        lastSuccess: checkedAt,
        status: isConfigured && !authenticated ? "AUTH_ERROR" : "HEALTHY",
        checkedAt,
      };
    } catch (err: any) {
      return {
        provider: "COPERNICUS_STAC",
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: false,
        authenticated: false,
        latencyMs: Date.now() - start,
        lastError: err.message,
        status: "UNAVAILABLE",
        checkedAt,
      };
    }
  }
}

export const copernicusSTACProvider = new CopernicusSTACProvider();
