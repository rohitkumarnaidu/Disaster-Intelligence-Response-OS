import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { syncAOICriticalAssets, getCachedCriticalAssets } from "../services/osm-sync";
import { checkAllDataSourcesHealth } from "../services/data-sources";
import { db, osmCriticalAssets } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

/**
 * POST /api/integrations/osm/sync
 * Sync critical infrastructure from OpenStreetMap Overpass
 */
router.post("/osm/sync", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"), async (req, res) => {
  try {
    const { incidentId, aoi } = req.body;
    if (!incidentId) {
      return res.status(400).json({ error: { message: "incidentId is required" } });
    }

    const result = await syncAOICriticalAssets(incidentId, aoi);
    res.json({
      success: true,
      message: `Successfully synchronized ${result.syncedCount} critical infrastructure assets from OpenStreetMap`,
      syncedCount: result.syncedCount,
      source: result.source,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/osm/status
 * Get cached critical infrastructure count and status
 */
router.get("/osm/status", async (req, res) => {
  try {
    const { incidentId } = req.query;
    const assets = await getCachedCriticalAssets(incidentId ? String(incidentId) : undefined);
    res.json({
      cachedAssetCount: assets.length,
      sampleAssets: assets.slice(0, 10),
      lastSyncAt: assets[0]?.retrievedAt || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/health
 * Aggregated health status across all external connectors
 */
router.get("/health", async (_req, res) => {
  try {
    const health = await checkAllDataSourcesHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/weather/flood
 * Get flood forecast from Open-Meteo
 */
router.get("/weather/flood", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { message: "lat and lng are required query parameters" } });
    }

    const { fetchFloodForecast } = await import("../lib/external-apis/open-meteo-flood");
    const forecast = await fetchFloodForecast(lat, lng);
    res.json(forecast);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/api-keys
 * Returns status and metadata of all external API keys
 */
router.get("/api-keys", async (_req, res) => {
  try {
    const maskKey = (key?: string) => {
      if (!key) return null;
      if (key.length <= 8) return "••••••••";
      return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
    };

    const keys = [
      {
        id: "GEMINI_API_KEY",
        name: "Google Gemini AI",
        description: "Powers multimodal satellite vision damage assessment and AI SITREP situation reporting.",
        category: "Multimodal AI",
        isConfigured: !!process.env.GEMINI_API_KEY,
        maskedValue: maskKey(process.env.GEMINI_API_KEY),
        registrationUrl: "https://aistudio.google.com/app/apikey",
        cost: "100% Free Tier",
        priority: "High",
      },
      {
        id: "NASA_FIRMS_MAP_KEY",
        name: "NASA FIRMS Satellite",
        description: "Enables real-time global thermal hotspot & active wildfire detection from VIIRS/MODIS satellites.",
        category: "Satellite Thermal",
        isConfigured: !!process.env.NASA_FIRMS_MAP_KEY,
        maskedValue: maskKey(process.env.NASA_FIRMS_MAP_KEY),
        registrationUrl: "https://firms.modaps.eosdis.nasa.gov/api/map_key",
        cost: "100% Free",
        priority: "Medium",
      },
      {
        id: "CDSE_CLIENT_ID",
        name: "Copernicus Data Space (ESA)",
        description: "Authorizes full-resolution raw Sentinel-1 SAR and Sentinel-2 optical data product downloads.",
        category: "Earth Observation",
        isConfigured: !!(process.env.CDSE_CLIENT_ID && process.env.CDSE_CLIENT_SECRET),
        maskedValue: maskKey(process.env.CDSE_CLIENT_ID),
        registrationUrl: "https://dataspace.copernicus.eu/",
        cost: "100% Free",
        priority: "Optional",
      },
      {
        id: "OPENWEATHERMAP_API_KEY",
        name: "OpenWeatherMap",
        description: "Commercial weather telemetry provider (Open-Meteo is already active as free fallback).",
        category: "Weather Telemetry",
        isConfigured: !!process.env.OPENWEATHERMAP_API_KEY,
        maskedValue: maskKey(process.env.OPENWEATHERMAP_API_KEY),
        registrationUrl: "https://openweathermap.org/api",
        cost: "Free Tier (1K calls/day)",
        priority: "Optional",
      },
      {
        id: "WAQI_API_TOKEN",
        name: "World Air Quality Index (WAQI)",
        description: "Ground-station air quality & PM2.5 monitor (Open-Meteo AQI is active as free fallback).",
        category: "Environmental",
        isConfigured: !!process.env.WAQI_API_TOKEN,
        maskedValue: maskKey(process.env.WAQI_API_TOKEN),
        registrationUrl: "https://aqicn.org/data-platform/token/",
        cost: "100% Free Token",
        priority: "Optional",
      },
      {
        id: "MAPTILER_API_KEY",
        name: "MapTiler Cloud",
        description: "High-resolution vector basemaps, 3D terrain elevation, and satellite tiles (100,000 calls/mo free).",
        category: "GIS & Base Maps",
        isConfigured: !!process.env.MAPTILER_API_KEY,
        maskedValue: maskKey(process.env.MAPTILER_API_KEY),
        registrationUrl: "https://cloud.maptiler.com/auth/create/",
        cost: "100% Free Tier (100K calls/mo)",
        priority: "Optional",
      },
    ];

    res.json({ keys });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/integrations/api-keys
 * Save or update an external API key dynamically in runtime
 */
router.post(
  "/api-keys",
  requireRole("System Admin", "Organization Admin", "Disaster Officer", "Commander"),
  async (req, res) => {
    try {
      const { keyId, keyValue, secretValue } = req.body;
      if (!keyId || typeof keyValue !== "string") {
        return res.status(400).json({ error: { message: "keyId and keyValue are required" } });
      }

      const trimmed = keyValue.trim();
      if (trimmed) {
        process.env[keyId] = trimmed;
        if (keyId === "CDSE_CLIENT_ID" && secretValue) {
          process.env.CDSE_CLIENT_SECRET = String(secretValue).trim();
        }
      } else {
        delete process.env[keyId];
        if (keyId === "CDSE_CLIENT_ID") {
          delete process.env.CDSE_CLIENT_SECRET;
        }
      }

      res.json({
        success: true,
        message: `API Key ${keyId} successfully updated`,
        keyId,
        isConfigured: !!process.env[keyId],
      });
    } catch (error: any) {
      res.status(500).json({ error: { message: error.message } });
    }
  }
);

/**
 * GET /api/integrations/firms/area
 * Queries active thermal anomalies from NASA FIRMS
 */
router.get("/firms/area", async (req, res) => {
  try {
    const west = parseFloat(req.query.west as string);
    const south = parseFloat(req.query.south as string);
    const east = parseFloat(req.query.east as string);
    const north = parseFloat(req.query.north as string);
    const days = parseInt((req.query.days as string) || "1", 10);
    const sensor = (req.query.sensor as any) || "VIIRS_SNPP_NRT";

    if (isNaN(west) || isNaN(south) || isNaN(east) || isNaN(north)) {
      return res.status(400).json({ error: { message: "west, south, east, north bounding box coordinates required" } });
    }

    const { fetchActiveFireHotspots } = await import("../lib/external-apis/nasa-firms");
    const hotspots = await fetchActiveFireHotspots({ west, south, east, north, days, sensor });
    res.json({
      count: hotspots.length,
      sensor,
      freshness: "NEAR_REAL_TIME",
      source: "NASA_FIRMS",
      hotspots,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/sachet/alerts
 * Queries India CAP disaster alerts from SACHET NDMA
 */
router.get("/sachet/alerts", async (_req, res) => {
  try {
    const { fetchSachetAlerts } = await import("../lib/external-apis/sachet-alerts");
    const alerts = await fetchSachetAlerts();
    res.json({
      count: alerts.length,
      freshness: "NEAR_REAL_TIME",
      source: "SACHET_NDMA",
      alerts,
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/imd/weather
 * Queries IMD observation telemetry
 */
router.get("/imd/weather", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 13.08;
    const lng = parseFloat(req.query.lng as string) || 80.27;
    const { fetchImdObservation } = await import("../lib/external-apis/imd-weather");
    const obs = await fetchImdObservation(lat, lng);
    res.json({
      observation: obs,
      source: obs ? "IMD_OBSERVATORY" : "NOT_CONFIGURED",
      freshness: "NEAR_REAL_TIME",
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/integrations/air-quality
 * Queries WAQI air quality with Open-Meteo fallback
 */
router.get("/air-quality", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 13.08;
    const lng = parseFloat(req.query.lng as string) || 80.27;
    const { fetchAirQuality } = await import("../lib/external-apis/waqi-air-quality");
    const aqi = await fetchAirQuality(lat, lng);
    res.json({
      airQuality: aqi,
      source: aqi?.stationName || "WAQI / Open-Meteo",
      freshness: "NEAR_REAL_TIME",
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
