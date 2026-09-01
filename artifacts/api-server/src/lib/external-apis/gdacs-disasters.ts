export interface GdacsDisasterEvent {
  externalId: string;
  title: string;
  severity: 'severe' | 'moderate' | 'minor' | 'unknown';
  eventType: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  boundingBox?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  country: string;
  populationExposed: number;
  sourceUrl: string;
  source: 'GDACS';
  eventTime: Date;
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
 * Fetches active disasters from GDACS
 * @returns Array of normalized disaster events
 */
export async function fetchActiveDisasters(): Promise<GdacsDisasterEvent[]> {
  const url = 'https://www.gdacs.org/gdacsapi/api/events/getmapdata';
  const response = await fetchWithRetry(url);
  const data: any = await response.json();

  return (data.features || []).map((feature: any): GdacsDisasterEvent => {
    const alertLevel = feature.properties?.alertlevel?.toLowerCase();
    let severity: GdacsDisasterEvent['severity'] = 'unknown';
    if (alertLevel === 'red') severity = 'severe';
    else if (alertLevel === 'orange') severity = 'moderate';
    else if (alertLevel === 'green') severity = 'minor';

    let boundingBox = undefined;
    if (feature.bbox && feature.bbox.length === 4) {
      const [minLon, minLat, maxLon, maxLat] = feature.bbox;
      boundingBox = {
        type: 'Polygon' as const,
        coordinates: [[
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat]
        ]]
      };
    }

    return {
      externalId: feature.properties?.eventid?.toString() || feature.id?.toString(),
      title: feature.properties?.name || feature.properties?.eventname || 'Unknown Event',
      severity,
      eventType: feature.properties?.eventtype || 'unknown',
      location: feature.geometry, // usually a Point
      boundingBox,
      country: feature.properties?.country || 'Unknown',
      populationExposed: feature.properties?.population || 0,
      sourceUrl: feature.properties?.url || `https://www.gdacs.org/report.aspx?eventtype=${feature.properties?.eventtype}&eventid=${feature.properties?.eventid}`,
      source: 'GDACS',
      eventTime: new Date(feature.properties?.fromdate || Date.now()),
      rawPayload: feature
    };
  });
}
