import {
  DataProvider,
  EarthObservationItem,
  SearchParams,
  SearchResult,
  ProviderHealth,
  ProviderError,
} from "./DataProvider";
import { logger } from "../lib/logger";

export interface OSMFeature {
  osmId: string;
  osmType: "node" | "way" | "relation";
  name: string;
  assetType: "Hospital" | "School" | "Emergency" | "Bridge" | "Utility" | "Shelter" | "General";
  latitude: number;
  longitude: number;
  geometry: {
    type: "Point" | "Polygon";
    coordinates: any;
  };
  tags: Record<string, string>;
  criticalityScore: number;
  populationExposureTier: "High" | "Medium" | "Low";
}

export class OpenStreetMapProvider implements DataProvider {
  public readonly id = "openstreetmap-overpass";
  public readonly name = "OpenStreetMap (Overpass API)";
  public readonly type = "VECTOR_OSM";

  private readonly overpassEndpoint =
    process.env.OSM_OVERPASS_URL || "https://overpass-api.de/api/interpreter";

  public async fetchInfrastructure(bbox: {
    south: number;
    west: number;
    north: number;
    east: number;
  }): Promise<OSMFeature[]> {
    const query = `[out:json][timeout:25];
(
  node["amenity"="hospital"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="fire_station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="police"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["highway"="bridge"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  way["bridge"="yes"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["power"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  node["amenity"="shelter"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out center;`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(this.overpassEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "DRAXELYRA-Disaster-Intelligence-OS/1.0",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429) {
          throw new ProviderError({
            code: "PROVIDER_RATE_LIMITED",
            message: "OpenStreetMap Overpass rate limit reached. Using local cache.",
            provider: "OPENSTREETMAP_OVERPASS",
            statusCode: 429,
            retryable: true,
          });
        }
        throw new ProviderError({
          code: "PROVIDER_UNAVAILABLE",
          message: `Overpass API error (${response.status})`,
          provider: "OPENSTREETMAP_OVERPASS",
          statusCode: response.status,
          retryable: true,
        });
      }

      const data: any = await response.json();
      const elements: any[] = data.elements || [];

      return elements.map((el) => {
        const tags = el.tags || {};
        let assetType: OSMFeature["assetType"] = "General";
        let criticalityScore = 50;
        let populationExposureTier: "High" | "Medium" | "Low" = "Low";

        if (tags.amenity === "hospital") {
          assetType = "Hospital";
          criticalityScore = 100;
          populationExposureTier = "High";
        } else if (tags.amenity === "school") {
          assetType = "School";
          criticalityScore = 70;
          populationExposureTier = "Medium";
        } else if (tags.amenity === "fire_station" || tags.amenity === "police") {
          assetType = "Emergency";
          criticalityScore = 95;
          populationExposureTier = "High";
        } else if (tags.bridge === "yes" || tags.highway === "bridge") {
          assetType = "Bridge";
          criticalityScore = 85;
          populationExposureTier = "Medium";
        } else if (tags.power === "station") {
          assetType = "Utility";
          criticalityScore = 80;
          populationExposureTier = "Medium";
        } else if (tags.amenity === "shelter") {
          assetType = "Shelter";
          criticalityScore = 90;
          populationExposureTier = "High";
        }

        const lat = el.lat ?? el.center?.lat ?? 0;
        const lon = el.lon ?? el.center?.lon ?? 0;

        return {
          osmId: String(el.id),
          osmType: el.type as any,
          name: tags.name || `${assetType} (${el.id})`,
          assetType,
          latitude: lat,
          longitude: lon,
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          tags,
          criticalityScore,
          populationExposureTier,
        };
      });
    } catch (err: any) {
      if (err instanceof ProviderError) throw err;
      logger.warn({ err }, "Overpass API fetch failed, gracefully falling back");
      throw new ProviderError({
        code: err.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE",
        message: err.message || "Failed to query OpenStreetMap Overpass",
        provider: "OPENSTREETMAP_OVERPASS",
        retryable: true,
      });
    }
  }

  public async search(_params: SearchParams): Promise<SearchResult> {
    return {
      items: [],
      sourceStatus: "HEALTHY",
      provider: "OPENSTREETMAP_OVERPASS",
    };
  }

  public async getMetadata(_externalId: string): Promise<EarthObservationItem> {
    throw new ProviderError({
      code: "PROVIDER_NOT_FOUND",
      message: "Direct satellite metadata not applicable to OSM",
      provider: "OPENSTREETMAP_OVERPASS",
    });
  }

  public async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    const checkedAt = new Date().toISOString();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("https://overpass-api.de/api/status", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      return {
        provider: "OPENSTREETMAP_OVERPASS",
        name: this.name,
        type: this.type,
        configured: true,
        reachable: res.ok,
        authenticated: true,
        latencyMs,
        lastSuccess: res.ok ? checkedAt : undefined,
        lastError: res.ok ? undefined : `HTTP ${res.status}`,
        status: res.ok ? "HEALTHY" : "DEGRADED",
        checkedAt,
      };
    } catch (err: any) {
      return {
        provider: "OPENSTREETMAP_OVERPASS",
        name: this.name,
        type: this.type,
        configured: true,
        reachable: false,
        authenticated: true,
        latencyMs: Date.now() - start,
        lastError: err.message,
        status: "UNAVAILABLE",
        checkedAt,
      };
    }
  }
}

export const openStreetMapProvider = new OpenStreetMapProvider();
