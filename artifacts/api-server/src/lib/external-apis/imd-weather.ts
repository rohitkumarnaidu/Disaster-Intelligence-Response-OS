import { logger } from "../logger";

export interface ImdObservation {
  station: string;
  location: {
    lat: number;
    lng: number;
  };
  temperature?: number;
  rainfallMm?: number;
  windSpeedKmph?: number;
  windDirectionDeg?: number;
  pressureHpa?: number;
  humidityPercent?: number;
  warningLevel?: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  warningDescription?: string;
  timestamp: Date;
  validFrom?: Date;
  validUntil?: Date;
  source: "IMD_OBSERVATORY" | "IMD_NOWCAST";
  retrievedAt: Date;
}

export interface ImdProviderStatus {
  configured: boolean;
  reachable: boolean;
  status: "HEALTHY" | "NOT_CONFIGURED" | "DEGRADED" | "UNAVAILABLE";
  lastError?: string;
  lastSuccess?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Fetches IMD city weather / warning telemetry if configured
 */
export async function fetchImdObservation(lat: number, lng: number): Promise<ImdObservation | null> {
  const imdBaseUrl = process.env.IMD_API_BASE_URL;
  const imdApiKey = process.env.IMD_API_KEY;

  if (!imdBaseUrl && !imdApiKey) {
    // IMD direct API endpoint is not explicitly configured
    return null;
  }

  try {
    const endpoint = `${imdBaseUrl || "https://mausam.imd.gov.in/api"}/observation?lat=${lat}&lon=${lng}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "DRAXELYRA-Disaster-OS/1.0",
    };
    if (imdApiKey) headers["Authorization"] = `Bearer ${imdApiKey}`;

    const res = await fetchWithTimeout(endpoint, { headers }, 5000);
    if (res.ok) {
      const data: any = await res.json();
      return {
        station: data.stationName || "IMD Regional Met Centre",
        location: { lat, lng },
        temperature: data.temp,
        rainfallMm: data.rainfall,
        windSpeedKmph: data.windSpeed,
        windDirectionDeg: data.windDir,
        pressureHpa: data.pressure,
        humidityPercent: data.humidity,
        warningLevel: data.warningColor || "YELLOW",
        warningDescription: data.bulletin || data.warning,
        timestamp: new Date(data.observationTime || Date.now()),
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
        source: "IMD_OBSERVATORY",
        retrievedAt: new Date(),
      };
    }
  } catch (err: any) {
    logger.warn({ err: err.message }, "IMD live observation endpoint check failed");
  }

  return null;
}
