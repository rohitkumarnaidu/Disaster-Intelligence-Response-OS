import { db, dataSources } from "@workspace/db";
import { providerRegistry } from "../providers";
import { ProviderHealth, DataSourceStatus, FreshnessClass } from "../providers/DataProvider";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export async function initializeDataSources(): Promise<void> {
  const initialSources = [
    {
      id: "copernicus-stac",
      provider: "COPERNICUS_STAC",
      name: "Copernicus Data Space Ecosystem (STAC)",
      type: "SATELLITE_CATALOG",
      baseUrl: "https://stac.dataspace.copernicus.eu/v1",
      authType: "OAUTH2",
      status: "CONFIGURED",
      freshnessClass: "ACQUISITION_DEPENDENT",
      coverage: "GLOBAL / S1 SAR & S2 OPTICAL",
    },
    {
      id: "copernicus-odata",
      provider: "COPERNICUS_ODATA",
      name: "Copernicus Data Space Ecosystem (OData)",
      type: "SATELLITE_CATALOG",
      baseUrl: "https://catalogue.dataspace.copernicus.eu/odata/v1/Products",
      authType: "OAUTH2",
      status: "CONFIGURED",
      freshnessClass: "ACQUISITION_DEPENDENT",
      coverage: "GLOBAL RAW PRODUCTS",
    },
    {
      id: "nasa-firms",
      provider: "NASA_FIRMS",
      name: "NASA FIRMS Fire & Thermal Anomaly System",
      type: "FIRE_HOTSPOTS",
      baseUrl: "https://firms.modaps.eosdis.nasa.gov/api",
      authType: "API_KEY",
      status: process.env.NASA_FIRMS_MAP_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "GLOBAL / INDIA NRT",
    },
    {
      id: "sachet-ndma",
      provider: "SACHET_NDMA",
      name: "SACHET (NDMA India National Disaster Alert Platform)",
      type: "CAP_ALERTS",
      baseUrl: "https://sachet.ndma.gov.in/cap_feed/rss.xml",
      authType: "NONE",
      status: "CONFIGURED",
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "INDIA NATIONWIDE",
    },
    {
      id: "imd-weather",
      provider: "IMD_WEATHER",
      name: "IMD (India Meteorological Department)",
      type: "METEOROLOGY",
      baseUrl: "https://mausam.imd.gov.in",
      authType: process.env.IMD_API_KEY ? "API_KEY" : "NONE",
      status: process.env.IMD_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "INDIA NATIONWIDE",
    },
    {
      id: "openweathermap",
      provider: "OPENWEATHERMAP",
      name: "OpenWeatherMap Telemetry (with Open-Meteo Fallback)",
      type: "METEOROLOGY",
      baseUrl: "https://api.openweathermap.org",
      authType: process.env.OPENWEATHERMAP_API_KEY ? "API_KEY" : "NONE",
      status: "HEALTHY",
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "GLOBAL / INDIA",
    },
    {
      id: "waqi-air-quality",
      provider: "WAQI",
      name: "World Air Quality Index (WAQI Ground Stations)",
      type: "ENVIRONMENTAL_AQI",
      baseUrl: "https://api.waqi.info/feed",
      authType: process.env.WAQI_API_TOKEN ? "API_KEY" : "NONE",
      status: process.env.WAQI_API_TOKEN ? "CONFIGURED" : "HEALTHY",
      freshnessClass: "NEAR_REAL_TIME",
      coverage: "GLOBAL / GROUND MONITORS",
    },
    {
      id: "openstreetmap-overpass",
      provider: "OPENSTREETMAP_OVERPASS",
      name: "OpenStreetMap (Overpass API)",
      type: "VECTOR_OSM",
      baseUrl: "https://overpass-api.de/api/interpreter",
      authType: "NONE",
      status: "HEALTHY",
      freshnessClass: "PERIODIC",
      coverage: "GLOBAL / INDIA INFRASTRUCTURE",
    },
    {
      id: "maptiler",
      provider: "MAPTILER",
      name: "MapTiler Cloud Basemaps & Satellite Tiles",
      type: "GIS_TILES",
      baseUrl: "https://api.maptiler.com",
      authType: process.env.MAPTILER_API_KEY ? "API_KEY" : "NONE",
      status: process.env.MAPTILER_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      freshnessClass: "PERIODIC",
      coverage: "GLOBAL / HIGH-RES GIS",
    },
    {
      id: "gemini-multimodal",
      provider: "GEMINI_MULTIMODAL",
      name: "Google Gemini Multimodal AI Provider",
      type: "MULTIMODAL_AI",
      baseUrl: "https://generativelanguage.googleapis.com",
      authType: "API_KEY",
      status: process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED",
      freshnessClass: "LIVE",
      coverage: "GLOBAL / AI INFERENCE",
    },
    {
      id: "demo-provider",
      provider: "DEMO",
      name: "Deterministic Replay Demo Provider",
      type: "DEMO_REPLAY",
      baseUrl: "internal://demo",
      authType: "NONE",
      status: "HEALTHY",
      freshnessClass: "CACHED",
      coverage: "INTERNAL REPLAY ONLY",
    },
  ];

  for (const src of initialSources) {
    try {
      const [existing] = await db.select().from(dataSources).where(eq(dataSources.id, src.id));
      if (!existing) {
        await db.insert(dataSources).values({
          ...src,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await db
          .update(dataSources)
          .set({
            name: src.name,
            type: src.type,
            baseUrl: src.baseUrl,
            authType: src.authType,
            freshnessClass: src.freshnessClass,
            coverage: src.coverage,
            updatedAt: new Date(),
          })
          .where(eq(dataSources.id, src.id));
      }
    } catch (err) {
      logger.warn({ err, srcId: src.id }, "Could not seed data source registry table");
    }
  }
}

export async function checkAllDataSourcesHealth(): Promise<ProviderHealth[]> {
  const results: ProviderHealth[] = [];

  for (const [, provider] of Array.from(providerRegistry.entries())) {
    // Avoid checking duplicate aliases
    if (results.some((r) => r.provider === provider.id || r.name === provider.name)) {
      continue;
    }

    try {
      const health = await provider.healthCheck();
      results.push(health);

      // Persist health status in DB
      try {
        await db
          .update(dataSources)
          .set({
            status: health.status,
            latencyMs: health.latencyMs,
            freshnessClass: health.freshnessClass,
            coverage: health.coverage,
            lastSuccessfulRequest: health.lastSuccess ? new Date(health.lastSuccess) : undefined,
            lastFailure: health.lastError ? new Date() : undefined,
            lastErrorMessage: health.lastError || null,
            updatedAt: new Date(),
          })
          .where(eq(dataSources.id, provider.id));
      } catch {
        // Continue even if db table is unreachable
      }
    } catch (err: any) {
      const failedHealth: ProviderHealth = {
        provider: provider.id,
        name: provider.name,
        type: provider.type,
        configured: false,
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        lastError: err.message,
        freshnessClass: "UNKNOWN",
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
      };
      results.push(failedHealth);
    }
  }

  return results;
}

export async function checkSingleDataSourceHealth(providerId: string): Promise<ProviderHealth> {
  const provider = providerRegistry.get(providerId);
  if (!provider) {
    throw new Error(`Data source provider '${providerId}' not found`);
  }

  const health = await provider.healthCheck();
  try {
    await db
      .update(dataSources)
      .set({
        status: health.status,
        latencyMs: health.latencyMs,
        freshnessClass: health.freshnessClass,
        coverage: health.coverage,
        lastSuccessfulRequest: health.lastSuccess ? new Date(health.lastSuccess) : undefined,
        lastFailure: health.lastError ? new Date() : undefined,
        lastErrorMessage: health.lastError || null,
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, provider.id));
  } catch {
    // ignore
  }

  return health;
}
