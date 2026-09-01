import { db, osmCriticalAssets, criticalAssets, incidents } from "@workspace/db";
import { openStreetMapProvider } from "../providers/OpenStreetMapProvider";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

function extractBBoxFromGeoJSON(geometry: any): { south: number; west: number; north: number; east: number } {
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;

  function traverse(coords: any) {
    if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
      const [lon, lat] = coords;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  }

  if (geometry?.coordinates) {
    traverse(geometry.coordinates);
  }

  // Fallback if empty coordinates
  if (minLon > maxLon || minLat > maxLat) {
    // Default to Chennai AOI bounding box
    return { south: 12.90, west: 80.10, north: 13.20, east: 80.35 };
  }

  // Add 0.02 deg buffer around AOI
  return {
    south: Math.max(-90, minLat - 0.02),
    west: Math.max(-180, minLon - 0.02),
    north: Math.min(90, maxLat + 0.02),
    east: Math.min(180, maxLon + 0.02),
  };
}

export async function syncAOICriticalAssets(
  incidentId: string,
  aoiGeometry?: any
): Promise<{ syncedCount: number; source: string }> {
  // If AOI not passed, retrieve from incident
  let aoi = aoiGeometry;
  if (!aoi) {
    const [inc] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    if (inc?.aoi) {
      aoi = (inc.aoi as any).geometry || inc.aoi;
    }
  }

  const bbox = extractBBoxFromGeoJSON(aoi);
  logger.info({ incidentId, bbox }, "Syncing critical infrastructure from OpenStreetMap Overpass");

  const osmFeatures = await openStreetMapProvider.fetchInfrastructure(bbox);

  let syncedCount = 0;
  for (const feat of osmFeatures) {
    const assetId = `osm-${feat.osmId}`;

    // Upsert into osm_critical_assets
    try {
      const [existingOsm] = await db
        .select()
        .from(osmCriticalAssets)
        .where(eq(osmCriticalAssets.id, assetId));

      if (existingOsm) {
        await db
          .update(osmCriticalAssets)
          .set({
            name: feat.name,
            assetType: feat.assetType,
            latitude: feat.latitude,
            longitude: feat.longitude,
            geometry: feat.geometry,
            tags: feat.tags,
            criticalityScore: feat.criticalityScore,
            populationExposureTier: feat.populationExposureTier,
            retrievedAt: new Date(),
          })
          .where(eq(osmCriticalAssets.id, assetId));
      } else {
        await db.insert(osmCriticalAssets).values({
          id: assetId,
          incidentId,
          osmId: feat.osmId,
          osmType: feat.osmType,
          name: feat.name,
          assetType: feat.assetType,
          latitude: feat.latitude,
          longitude: feat.longitude,
          geometry: feat.geometry,
          tags: feat.tags,
          criticalityScore: feat.criticalityScore,
          populationExposureTier: feat.populationExposureTier,
          source: "OpenStreetMap",
          retrievedAt: new Date(),
        });
      }

      // Also ensure critical_assets table has the record for case linking
      const [existingCrit] = await db
        .select()
        .from(criticalAssets)
        .where(eq(criticalAssets.id, assetId));

      if (!existingCrit) {
        await db.insert(criticalAssets).values({
          id: assetId,
          name: feat.name,
          type: feat.assetType,
          location: feat.geometry,
          criticalityScore: feat.criticalityScore,
          populationExposureTier: feat.populationExposureTier,
          osmId: feat.osmId,
        });
      }

      syncedCount++;
    } catch (err) {
      logger.warn({ err, assetId }, "Error persisting OSM critical asset");
    }
  }

  return { syncedCount, source: "OpenStreetMap Overpass API" };
}

export async function getCachedCriticalAssets(incidentId?: string) {
  if (incidentId) {
    const assets = await db
      .select()
      .from(osmCriticalAssets)
      .where(eq(osmCriticalAssets.incidentId, incidentId));
    if (assets.length > 0) return assets;
  }
  return db.select().from(osmCriticalAssets);
}
