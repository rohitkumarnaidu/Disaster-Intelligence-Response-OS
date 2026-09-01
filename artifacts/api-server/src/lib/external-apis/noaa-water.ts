export interface NoaaWaterLevel {
  stationId: string;
  waterLevel: number;
  time: Date;
  sigma: number;
  flags: string;
}

export interface NoaaStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
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
 * Fetches water level for a specific NOAA station
 * @param stationId Station ID
 * @returns Normalized water level data
 */
export async function fetchWaterLevel(stationId: string): Promise<NoaaWaterLevel> {
  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=${stationId}&product=water_level&datum=STND&time_zone=gmt&units=metric&format=json`;
  const response = await fetchWithRetry(url);
  const data: any = await response.json();

  if (data.error) {
    throw new Error(`NOAA API error: ${data.error.message}`);
  }

  const latest = data.data && data.data.length > 0 ? data.data[0] : null;
  if (!latest) {
    throw new Error('No data returned from NOAA');
  }

  return {
    stationId,
    waterLevel: parseFloat(latest.v),
    time: new Date(latest.t + 'Z'),
    sigma: parseFloat(latest.s),
    flags: latest.f
  };
}

/**
 * Fetches nearby active NOAA stations (mocked implementation for discovery endpoint)
 * In production, you would fetch from the NOAA MDAPI to find nearby stations.
 * @param lat Latitude
 * @param lng Longitude
 * @returns Array of nearby NOAA stations
 */
export async function fetchNearbyStations(lat: number, lng: number): Promise<NoaaStation[]> {
  // NOAA provides an MDAPI to find stations, e.g. https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json
  const url = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=waterlevels';
  const response = await fetchWithRetry(url);
  const data: any = await response.json();

  const allStations = data.stations || [];
  
  // Basic distance calculation
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find stations within ~100km
  const nearby = allStations
    .filter((s: any) => {
      const dist = getDistance(lat, lng, s.lat, s.lng);
      return dist <= 100;
    })
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng
    }));

  return nearby;
}
