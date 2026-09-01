import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { copernicusAuthService } from "../services/copernicus-auth";
import { logger } from "../lib/logger";

export class CopernicusODataProvider implements DataProvider {
  public readonly id = "copernicus-odata";
  public readonly name = "Copernicus Data Space Ecosystem (OData)";
  public readonly type = "SATELLITE_CATALOG";

  private readonly odataBase = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products";

  public async search(params: SearchParams): Promise<SearchResult> {
    const filters: string[] = [];

    if (params.collection) {
      if (params.collection.includes("sentinel-1")) {
        filters.push("contains(Name, 'S1')");
      } else if (params.collection.includes("sentinel-2")) {
        filters.push("contains(Name, 'S2')");
      }
    }

    if (params.startDate) {
      filters.push(`ContentDate/Start ge ${new Date(params.startDate).toISOString()}`);
    }
    if (params.endDate) {
      filters.push(`ContentDate/End le ${new Date(params.endDate).toISOString()}`);
    }

    const queryParams = new URLSearchParams({
      $top: String(Math.min(params.limit || 20, 50)),
      $orderby: "ContentDate/Start desc",
    });

    if (filters.length > 0) {
      queryParams.set("$filter", filters.join(" and "));
    }

    const url = `${this.odataBase}?${queryParams.toString()}`;
    const headers: Record<string, string> = { Accept: "application/json" };

    if (copernicusAuthService.isConfigured()) {
      const token = await copernicusAuthService.getAccessToken().catch(() => null);
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new ProviderError({
          code: response.status === 401 ? "PROVIDER_AUTH_FAILED" : "PROVIDER_UNAVAILABLE",
          message: `Copernicus OData returned error (${response.status})`,
          provider: "COPERNICUS_ODATA",
          statusCode: response.status,
        });
      }

      const data: any = await response.json();
      const rawProducts: any[] = data.value || [];

      const items: EarthObservationItem[] = rawProducts.map((p) => {
        const id = p.Id || `odata-${Date.now()}`;
        const name = p.Name || "Satellite Product";
        const isS1 = name.includes("S1");
        const collection = isS1 ? "sentinel-1-grd" : "sentinel-2-l2a";
        const platform = isS1 ? "Sentinel-1" : "Sentinel-2";

        let geometry: any = { type: "Polygon", coordinates: [] };
        let bbox: [number, number, number, number] = [0, 0, 0, 0];
        if (p.Footprint) {
          try {
            // GeoJSON or WKT string
            if (typeof p.Footprint === "string" && p.Footprint.startsWith("geography'SRID=4326;POLYGON")) {
              const matches = p.Footprint.match(/\(\((.*?)\)\)/);
              if (matches && matches[1]) {
                const pairs = matches[1].split(",").map((s: string) => {
                  const [lon, lat] = s.trim().split(" ").map(Number);
                  return [lon, lat];
                });
                geometry = { type: "Polygon", coordinates: [pairs] };
                const lons = pairs.map((pt: number[]) => pt[0]);
                const lats = pairs.map((pt: number[]) => pt[1]);
                bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
              }
            }
          } catch {
            // keep default geometry
          }
        }

        return {
          externalId: id,
          provider: "COPERNICUS_ODATA",
          collection,
          platform,
          datetime: p.ContentDate?.Start || new Date().toISOString(),
          startDatetime: p.ContentDate?.Start,
          endDatetime: p.ContentDate?.End,
          geometry,
          bbox,
          processingLevel: "LEVEL1",
          assets: {
            download: {
              href: `${this.odataBase}(${id})/$value`,
              type: "application/octet-stream",
              title: "Product Archive",
            },
          },
          providerMetadata: p,
          qualityStatus: "READY",
          dataMode: "REAL",
          catalogUrl: `https://browser.dataspace.copernicus.eu/?id=${encodeURIComponent(id)}`,
          sourceUrl: `${this.odataBase}(${id})`,
        };
      });

      return {
        items,
        sourceStatus: "HEALTHY",
        provider: "COPERNICUS_ODATA",
        totalCount: items.length,
      };
    } catch (err: any) {
      if (err instanceof ProviderError) throw err;
      logger.error({ err }, "Copernicus OData search error");
      throw new ProviderError({
        code: "PROVIDER_UNAVAILABLE",
        message: err.message || "Failed to query Copernicus OData catalog",
        provider: "COPERNICUS_ODATA",
        cause: err,
      });
    }
  }

  public async getMetadata(externalId: string): Promise<EarthObservationItem> {
    const url = `${this.odataBase}(${encodeURIComponent(externalId)})`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (copernicusAuthService.isConfigured()) {
      const token = await copernicusAuthService.getAccessToken().catch(() => null);
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ProviderError({
        code: response.status === 404 ? "PROVIDER_NOT_FOUND" : "PROVIDER_UNAVAILABLE",
        message: `Product ${externalId} not found in OData catalog`,
        provider: "COPERNICUS_ODATA",
        statusCode: response.status,
      });
    }

    const p: any = await response.json();
    return {
      externalId: p.Id,
      provider: "COPERNICUS_ODATA",
      collection: p.Name?.includes("S1") ? "sentinel-1-grd" : "sentinel-2-l2a",
      platform: p.Name?.includes("S1") ? "Sentinel-1" : "Sentinel-2",
      datetime: p.ContentDate?.Start || new Date().toISOString(),
      geometry: { type: "Polygon", coordinates: [] },
      bbox: [0, 0, 0, 0],
      processingLevel: "LEVEL1",
      assets: {},
      providerMetadata: p,
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
      const res = await fetch(`${this.odataBase}?$top=1`, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      return {
        provider: "COPERNICUS_ODATA",
        name: this.name,
        type: this.type,
        configured: isConfigured,
        reachable: res.ok,
        authenticated: isConfigured,
        latencyMs,
        lastSuccess: res.ok ? checkedAt : undefined,
        lastError: res.ok ? undefined : `HTTP ${res.status}`,
        status: res.ok ? "HEALTHY" : "DEGRADED",
        checkedAt,
      };
    } catch (err: any) {
      return {
        provider: "COPERNICUS_ODATA",
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

export const copernicusODataProvider = new CopernicusODataProvider();
