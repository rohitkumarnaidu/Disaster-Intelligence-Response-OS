export interface FloodForecast {
  latitude: number;
  longitude: number;
  dailyDischarge: Array<{ date: string; discharge: number }>;
  maxDischarge: number;
  isFloodRisk: boolean;
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
  throw new Error('Unreachable');
}

/**
 * Fetches flood forecast from Open-Meteo
 * @param lat Latitude
 * @param lng Longitude
 * @returns Normalized flood forecast data
 */
export async function fetchFloodForecast(lat: number, lng: number): Promise<FloodForecast> {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge&forecast_days=7`;
  const response = await fetchWithRetry(url);
  const data: any = await response.json();

  const time = data.daily?.time || [];
  const discharge = data.daily?.river_discharge || [];
  
  const dailyDischarge = time.map((t: string, idx: number) => ({
    date: t,
    discharge: discharge[idx] || 0
  }));

  const maxDischarge = dailyDischarge.reduce((max: number, current: { discharge: number }) => 
    current.discharge > max ? current.discharge : max, 0);

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    dailyDischarge,
    maxDischarge,
    isFloodRisk: maxDischarge > 500
  };
}
