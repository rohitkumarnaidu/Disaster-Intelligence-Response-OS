import { Router } from "express";
import { db, weatherAlerts, externalFeeds } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { desc, eq } from "drizzle-orm";
import { fetchCurrentWeather } from "../lib/external-apis/openweathermap";
import { fetchAirQuality } from "../lib/external-apis/waqi-air-quality";
import { fetchFloodForecast } from "../lib/external-apis/open-meteo-flood";
import { fetchActiveWeatherAlerts } from "../lib/external-apis/nws-alerts";

const router = Router();
router.use(requireAuth);

/** GET /api/weather/alerts — Active weather alerts from DB */
router.get("/alerts", async (_req, res) => {
  try {
    const alerts = await db
      .select()
      .from(weatherAlerts)
      .orderBy(desc(weatherAlerts.createdAt))
      .limit(50);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** GET /api/weather/alerts/live — Fetch live alerts from NWS (bypasses DB) */
router.get("/alerts/live", async (req, res) => {
  try {
    const area = (req.query.area as string) || undefined;
    const alerts = await fetchActiveWeatherAlerts({ area });
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** GET /api/weather/current/:lat/:lng — Current weather conditions */
router.get("/current/:lat/:lng", async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { message: "Invalid lat/lng" } });
    }
    const weather = await fetchCurrentWeather(lat, lng);
    if (!weather) {
      return res.status(503).json({ error: { message: "Weather API unavailable — OPENWEATHERMAP_API_KEY not configured" } });
    }
    res.json(weather);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** GET /api/weather/air-quality/:lat/:lng — Real-time AQI */
router.get("/air-quality/:lat/:lng", async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { message: "Invalid lat/lng" } });
    }
    const aqi = await fetchAirQuality(lat, lng);
    if (!aqi) {
      return res.status(503).json({ error: { message: "AQI API unavailable — WAQI_API_TOKEN not configured" } });
    }
    res.json(aqi);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** GET /api/weather/flood/:lat/:lng — River discharge flood forecast */
router.get("/flood/:lat/:lng", async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: { message: "Invalid lat/lng" } });
    }
    const flood = await fetchFloodForecast(lat, lng);
    res.json(flood);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
