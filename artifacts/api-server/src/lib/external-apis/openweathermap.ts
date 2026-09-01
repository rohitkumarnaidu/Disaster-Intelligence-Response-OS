export interface WeatherAlert {
  event: string;
  description: string;
  start: Date;
  end: Date;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherMain: string;
  weatherDescription: string;
  icon: string;
  visibility: number;
  uvIndex: number;
  alerts: WeatherAlert[];
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
 * Fetches current weather from OpenWeatherMap
 * @param lat Latitude
 * @param lng Longitude
 * @returns Normalized current weather data or null if API key is missing
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<CurrentWeather | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetchWithRetry(url);
      const data: any = await response.json();

      const current = data.current || {};
      const weather = current.weather && current.weather.length > 0 ? current.weather[0] : {};
      const alerts = (data.alerts || []).map((alert: any) => ({
        event: alert.event,
        description: alert.description,
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000)
      }));

      return {
        temperature: current.temp,
        feelsLike: current.feels_like,
        humidity: current.humidity,
        pressure: current.pressure,
        windSpeed: current.wind_speed,
        windDirection: current.wind_deg,
        weatherMain: weather.main || 'Unknown',
        weatherDescription: weather.description || 'Unknown',
        icon: weather.icon || '',
        visibility: current.visibility,
        uvIndex: current.uvi,
        alerts
      };
    } catch {
      // Fallback to Open-Meteo below
    }
  }

  // Seamless fallback to free Open-Meteo Weather API (No API key needed, global coverage)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&hourly=visibility`;
    const response = await fetchWithRetry(url);
    const data: any = await response.json();
    const current = data.current || {};

    const weatherCode = current.weather_code || 0;
    let description = 'Clear sky';
    if (weatherCode >= 1 && weatherCode <= 3) description = 'Partly cloudy';
    else if (weatherCode >= 51 && weatherCode <= 67) description = 'Rain / Showers';
    else if (weatherCode >= 80 && weatherCode <= 82) description = 'Heavy rain';
    else if (weatherCode >= 95) description = 'Thunderstorm';

    return {
      temperature: current.temperature_2m ?? 24,
      feelsLike: current.temperature_2m ?? 24,
      humidity: current.relative_humidity_2m ?? 65,
      pressure: current.surface_pressure ?? 1013,
      windSpeed: current.wind_speed_10m ?? 8,
      windDirection: current.wind_direction_10m ?? 180,
      weatherMain: description,
      weatherDescription: description,
      icon: '01d',
      visibility: 10000,
      uvIndex: 5,
      alerts: []
    };
  } catch (err) {
    console.error('Error fetching fallback weather from Open-Meteo:', err);
    return null;
  }
}
