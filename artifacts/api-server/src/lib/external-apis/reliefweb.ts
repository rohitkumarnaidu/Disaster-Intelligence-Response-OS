export interface ReliefWebDisasterEvent {
  externalId: string;
  title: string;
  eventType: string;
  country: string;
  status: string;
  sourceUrl: string;
  description: string;
  source: 'ReliefWeb';
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
 * Fetches active disaster reports from ReliefWeb
 * @returns Array of normalized ReliefWeb disaster events
 */
export async function fetchActiveDisasterReports(): Promise<ReliefWebDisasterEvent[]> {
  const url = 'https://api.reliefweb.int/v1/disasters?appname=draxelyra&filter[field]=status&filter[value]=current&limit=20&profile=full';
  const response = await fetchWithRetry(url);
  const data: any = await response.json();

  return (data.data || []).map((item: any): ReliefWebDisasterEvent => {
    const fields = item.fields || {};
    return {
      externalId: item.id.toString(),
      title: fields.name || 'Unknown',
      eventType: fields.primary_type?.name || (fields.type && fields.type.length > 0 ? fields.type[0].name : 'unknown'),
      country: fields.primary_country?.name || (fields.country && fields.country.length > 0 ? fields.country[0].name : 'Unknown'),
      status: fields.status || 'current',
      sourceUrl: fields.url || `https://reliefweb.int/disaster/${item.id}`,
      description: fields.description || '',
      source: 'ReliefWeb',
      eventTime: new Date(fields.date?.created || Date.now()),
      rawPayload: item
    };
  });
}
