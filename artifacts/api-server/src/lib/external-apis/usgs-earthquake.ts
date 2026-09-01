export interface UsgsEarthquakeEvent {
  externalId: string;
  title: string;
  magnitude: number;
  severity: 'destroyed' | 'severe' | 'moderate' | 'minor' | 'no damage';
  location: {
    type: 'Point';
    coordinates: [number, number, number?];
  };
  boundingBox: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  eventTime: Date;
  source: 'USGS';
  eventType: 'earthquake';
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
 * Fetches recent earthquakes from USGS
 * @param options Options for filtering
 * @returns Array of normalized earthquake events
 */
export async function fetchRecentEarthquakes(options?: { startTime?: Date, minMagnitude?: number }): Promise<UsgsEarthquakeEvent[]> {
  const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
  url.searchParams.append('format', 'geojson');
  
  if (options?.startTime) {
    url.searchParams.append('starttime', options.startTime.toISOString());
  } else {
    // Default to last 7 days if not provided
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    url.searchParams.append('starttime', lastWeek.toISOString());
  }
  
  url.searchParams.append('minmagnitude', (options?.minMagnitude ?? 2.5).toString());

  const response = await fetchWithRetry(url.toString());
  const data: any = await response.json();

  return (data.features || []).map((feature: any): UsgsEarthquakeEvent => {
    const mag = feature.properties.mag;
    let severity: UsgsEarthquakeEvent['severity'] = 'no damage';
    if (mag >= 7.0) severity = 'destroyed';
    else if (mag >= 6.0) severity = 'severe';
    else if (mag >= 5.0) severity = 'moderate';
    else if (mag >= 4.0) severity = 'minor';

    const coords = feature.geometry.coordinates; // [longitude, latitude, depth]
    const lon = coords[0];
    const lat = coords[1];
    const offset = 0.5; // ~50km

    return {
      externalId: feature.id,
      title: feature.properties.title,
      magnitude: mag,
      severity,
      location: {
        type: 'Point',
        coordinates: coords
      },
      boundingBox: {
        type: 'Polygon',
        coordinates: [[
          [lon - offset, lat - offset],
          [lon + offset, lat - offset],
          [lon + offset, lat + offset],
          [lon - offset, lat + offset],
          [lon - offset, lat - offset]
        ]]
      },
      eventTime: new Date(feature.properties.time),
      source: 'USGS',
      eventType: 'earthquake',
      rawPayload: feature
    };
  });
}
