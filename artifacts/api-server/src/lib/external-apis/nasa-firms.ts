import { logger } from "../logger";

export interface NasaFirmsFireHotspot {
  externalId: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  latitude: number;
  longitude: number;
  confidence: string;
  brightness: number;
  frp: number;
  satellite: string;
  instrument: string;
  acqDate: string;
  acqTime: string;
  eventTime: Date;
  source: "NASA_FIRMS";
  retrievedAt: Date;
}

export interface FirmsQueryOptions {
  west: number;
  south: number;
  east: number;
  north: number;
  days?: number;
  sensor?: "VIIRS_SNPP_NRT" | "VIIRS_NOAA20_NRT" | "VIIRS_NOAA21_NRT" | "MODIS_NRT";
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 1, timeoutMs = 10000): Promise<Response> {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(id);
      if (attempt === retries) throw err;
      attempt++;
    }
  }
  throw new Error("Unreachable");
}

/**
 * Validates NASA FIRMS MAP_KEY by probing availability
 */
export async function validateFirmsKey(): Promise<{ configured: boolean; authenticated: boolean; latencyMs: number; status: string; error?: string }> {
  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) {
    return {
      configured: false,
      authenticated: false,
      latencyMs: 0,
      status: "NOT_CONFIGURED",
      error: "NASA_FIRMS_MAP_KEY is not set",
    };
  }

  const start = Date.now();
  try {
    // Probing FIRMS transaction count API for key validation
    const testUrl = `https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${mapKey}/VIIRS_SNPP_NRT`;
    const res = await fetchWithRetry(testUrl, {}, 0, 6000);
    const text = await res.text();
    const latencyMs = Date.now() - start;

    if (text.toLowerCase().includes("invalid map_key") || text.toLowerCase().includes("bad key")) {
      return {
        configured: true,
        authenticated: false,
        latencyMs,
        status: "AUTH_ERROR",
        error: "Invalid NASA_FIRMS_MAP_KEY supplied",
      };
    }

    return {
      configured: true,
      authenticated: true,
      latencyMs,
      status: "HEALTHY",
    };
  } catch (err: any) {
    return {
      configured: true,
      authenticated: false,
      latencyMs: Date.now() - start,
      status: "UNAVAILABLE",
      error: err.message,
    };
  }
}

/**
 * Fetches active fire / thermal anomalies from NASA FIRMS
 */
export async function fetchActiveFireHotspots(options: FirmsQueryOptions): Promise<NasaFirmsFireHotspot[]> {
  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  if (!mapKey) {
    logger.warn("NASA_FIRMS_MAP_KEY is not set. Skipping FIRMS fetch.");
    return [];
  }

  const { west, south, east, north, days = 1, sensor = "VIIRS_SNPP_NRT" } = options;
  const bboxString = `${west},${south},${east},${north}`;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${sensor}/${bboxString}/${days}`;

  try {
    const response = await fetchWithRetry(url);
    const csvText = await response.text();

    if (csvText.toLowerCase().includes("invalid map_key") || csvText.toLowerCase().includes("error")) {
      logger.warn({ text: csvText.slice(0, 100) }, "FIRMS API key validation error");
      return [];
    }

    const lines = csvText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(",");
    const getIdx = (name: string) => headers.indexOf(name);

    const latIdx = getIdx("latitude");
    const lonIdx = getIdx("longitude");
    const confIdx = getIdx("confidence");
    const brightIdx = getIdx("bright_ti4") !== -1 ? getIdx("bright_ti4") : getIdx("brightness");
    const frpIdx = getIdx("frp");
    const satIdx = getIdx("satellite");
    const instrumentIdx = getIdx("instrument");
    const acqDateIdx = getIdx("acq_date");
    const acqTimeIdx = getIdx("acq_time");

    const hotspots: NasaFirmsFireHotspot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      if (row.length < headers.length) continue;

      const lat = parseFloat(row[latIdx]);
      const lon = parseFloat(row[lonIdx]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const acqDate = row[acqDateIdx] || new Date().toISOString().split("T")[0];
      const acqTime = row[acqTimeIdx] || "0000";
      const paddedTime = acqTime.padStart(4, "0");
      const dateStr = `${acqDate}T${paddedTime.substring(0, 2)}:${paddedTime.substring(2, 4)}:00Z`;

      hotspots.push({
        externalId: `firms_${lat.toFixed(4)}_${lon.toFixed(4)}_${acqDate}_${paddedTime}`,
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        latitude: lat,
        longitude: lon,
        confidence: row[confIdx] || "nominal",
        brightness: brightIdx !== -1 ? parseFloat(row[brightIdx]) || 0 : 0,
        frp: frpIdx !== -1 ? parseFloat(row[frpIdx]) || 0 : 0,
        satellite: satIdx !== -1 ? row[satIdx] : sensor,
        instrument: instrumentIdx !== -1 ? row[instrumentIdx] : "VIIRS",
        acqDate,
        acqTime: paddedTime,
        eventTime: new Date(dateStr),
        source: "NASA_FIRMS",
        retrievedAt: new Date(),
      });
    }

    return hotspots;
  } catch (err: any) {
    logger.error({ err: err.message, url }, "Error fetching FIRMS active fire hotspots");
    return [];
  }
}
