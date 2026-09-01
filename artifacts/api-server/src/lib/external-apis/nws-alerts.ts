export interface NwsAlertEvent {
  externalId: string;
  alertType: string;
  severity: string;
  headline: string;
  description: string;
  instruction: string;
  area: any; // GeoJSON geometry
  effectiveAt: Date;
  expiresAt: Date;
  source: 'NWS';
  rawPayload: any;
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
 * Fetches active weather alerts from NWS
 * @param options Options for filtering
 * @returns Array of normalized weather alerts
 */
export async function fetchActiveWeatherAlerts(options?: { area?: string }): Promise<NwsAlertEvent[]> {
  const url = new URL('https://api.weather.gov/alerts/active');
  url.searchParams.append('status', 'actual');
  url.searchParams.append('message_type', 'alert');
  
  if (options?.area) {
    url.searchParams.append('area', options.area);
  }

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      'User-Agent': 'DRAXELYRA-Response-OS/1.0 (emergency-response-system)'
    }
  });
  
  const data: any = await response.json();

  return (data.features || []).map((feature: any): NwsAlertEvent => {
    return {
      externalId: feature.properties.id,
      alertType: feature.properties.event,
      severity: feature.properties.severity,
      headline: feature.properties.headline,
      description: feature.properties.description || '',
      instruction: feature.properties.instruction || '',
      area: feature.geometry,
      effectiveAt: new Date(feature.properties.effective),
      expiresAt: new Date(feature.properties.expires),
      source: 'NWS',
      rawPayload: feature
    };
  });
}
