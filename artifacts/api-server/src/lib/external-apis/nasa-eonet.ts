export interface NasaEonetEvent {
  externalId: string;
  title: string;
  eventType: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  source: 'EONET';
  eventTime: Date;
  sourceUrl: string;
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
 * Fetches natural events from NASA EONET
 * @param options Filter options
 * @returns Array of normalized EONET events
 */
export async function fetchNaturalEvents(options?: { category?: string; days?: number }): Promise<NasaEonetEvent[]> {
  const url = new URL('https://eonet.gsfc.nasa.gov/api/v3/events');
  url.searchParams.append('status', 'open');
  url.searchParams.append('limit', '50');
  
  if (options?.category) {
    url.searchParams.append('category', options.category);
  }
  if (options?.days) {
    url.searchParams.append('days', options.days.toString());
  }

  const response = await fetchWithRetry(url.toString());
  const data: any = await response.json();

  const categoryMap: Record<string, string> = {
    'wildfires': 'wildfire',
    'severeStorms': 'storm',
    'volcanoes': 'volcano',
    'floods': 'flood'
  };

  return (data.events || []).map((event: any): NasaEonetEvent => {
    const rawCategory = event.categories?.[0]?.id || 'unknown';
    const eventType = categoryMap[rawCategory] || rawCategory;
    
    let location: NasaEonetEvent['location'] = null;
    let eventDate = new Date();
    
    if (event.geometry && event.geometry.length > 0) {
      const geom = event.geometry[0]; // Take the latest geometry
      if (geom.type === 'Point') {
        location = {
          type: 'Point',
          coordinates: geom.coordinates as [number, number]
        };
      }
      if (geom.date) {
        eventDate = new Date(geom.date);
      }
    }

    return {
      externalId: event.id,
      title: event.title,
      eventType,
      location,
      source: 'EONET',
      eventTime: eventDate,
      sourceUrl: event.link,
      rawPayload: event
    };
  });
}
