export interface CriticalInfrastructure {
  osmId: string;
  name: string;
  type: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  criticalityScore: number;
  populationExposureTier: 'High' | 'Medium' | 'Low';
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
 * Fetches critical infrastructure from OSM Overpass API
 * @param bbox Bounding box object
 * @returns Array of normalized critical infrastructure points
 */
export async function fetchCriticalInfrastructure(bbox: { south: number; west: number; north: number; east: number }): Promise<CriticalInfrastructure[]> {
  const query = `[out:json][timeout:25]; ( 
    node["amenity"="hospital"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
    node["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
    node["amenity"="fire_station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
    way["bridge"="yes"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
    node["power"="station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
    node["amenity"="police"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}); 
  ); out center;`;

  const response = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const data: any = await response.json();

  return (data.elements || []).map((element: any): CriticalInfrastructure => {
    const tags = element.tags || {};
    let type = 'Unknown';
    let criticalityScore = 50;
    let populationExposureTier: 'High' | 'Medium' | 'Low' = 'Low';

    if (tags.amenity === 'hospital') {
      type = 'Hospital';
      criticalityScore = 100;
      populationExposureTier = 'High';
    } else if (tags.amenity === 'school') {
      type = 'School';
      criticalityScore = 70;
      populationExposureTier = 'Medium';
    } else if (tags.amenity === 'fire_station' || tags.amenity === 'police') {
      type = 'Emergency';
      criticalityScore = 100;
      populationExposureTier = 'High';
    } else if (tags.bridge === 'yes') {
      type = 'Bridge';
      criticalityScore = 85;
      populationExposureTier = 'Medium';
    } else if (tags.power === 'station') {
      type = 'Utility';
      criticalityScore = 75;
      populationExposureTier = 'Medium';
    }

    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;

    return {
      osmId: element.id.toString(),
      name: tags.name || `${type} ${element.id}`,
      type,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      criticalityScore,
      populationExposureTier
    };
  });
}
