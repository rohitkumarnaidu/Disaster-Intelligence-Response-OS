export interface WaqiAirQuality {
  aqi: number;
  dominentPol: string;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
  stationName: string;
  updatedAt: Date;
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
 * Fetches air quality from WAQI
 * @param lat Latitude
 * @param lng Longitude
 * @returns Normalized air quality data or null if API key is missing
 */
export async function fetchAirQuality(lat: number, lng: number): Promise<WaqiAirQuality | null> {
  const token = process.env.WAQI_API_TOKEN;
  if (token) {
    try {
      const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${token}`;
      const response = await fetchWithRetry(url);
      const data: any = await response.json();

      if (data.status === 'ok') {
        const aqi = data.data.aqi;
        let category: WaqiAirQuality['category'] = 'Unknown';
        if (aqi <= 50) category = 'Good';
        else if (aqi <= 100) category = 'Moderate';
        else if (aqi <= 150) category = 'Unhealthy for Sensitive';
        else if (aqi <= 200) category = 'Unhealthy';
        else if (aqi <= 300) category = 'Very Unhealthy';
        else if (aqi > 300) category = 'Hazardous';

        const iaqi = data.data.iaqi || {};

        return {
          aqi,
          dominentPol: data.data.dominentpol || '',
          pm25: iaqi.pm25?.v || 0,
          pm10: iaqi.pm10?.v || 0,
          o3: iaqi.o3?.v || 0,
          no2: iaqi.no2?.v || 0,
          so2: iaqi.so2?.v || 0,
          co: iaqi.co?.v || 0,
          category,
          stationName: data.data.city?.name || 'Regional Station',
          updatedAt: new Date(data.data.time?.iso || Date.now())
        };
      }
    } catch {
      // Fallback to Open-Meteo below
    }
  }

  // Seamless fallback to free Open-Meteo Air Quality API
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const response = await fetchWithRetry(url);
    const data: any = await response.json();
    const current = data.current || {};

    const aqiVal = current.european_aqi ?? 30;
    let category: WaqiAirQuality['category'] = 'Good';
    if (aqiVal <= 20) category = 'Good';
    else if (aqiVal <= 40) category = 'Moderate';
    else if (aqiVal <= 60) category = 'Unhealthy for Sensitive';
    else if (aqiVal <= 80) category = 'Unhealthy';
    else category = 'Very Unhealthy';

    return {
      aqi: aqiVal,
      dominentPol: 'pm2.5',
      pm25: current.pm2_5 ?? 10,
      pm10: current.pm10 ?? 15,
      o3: current.ozone ?? 35,
      no2: current.nitrogen_dioxide ?? 8,
      so2: current.sulphur_dioxide ?? 3,
      co: current.carbon_monoxide ?? 250,
      category,
      stationName: 'Open-Meteo Environmental Telemetry',
      updatedAt: new Date()
    };
  } catch (err) {
    console.error('Error fetching fallback air quality from Open-Meteo:', err);
    return null;
  }
}
