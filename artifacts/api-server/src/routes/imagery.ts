import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { getProvider } from "../providers";
import { db, imageryAssets, imageryPairs, incidents } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { jobRunner } from "../services/job-runner";
import { logger } from "../lib/logger";

const router = Router();
router.use(requireAuth);

/**
 * POST /api/imagery/search
 * Live STAC / Catalog search across satellite providers
 */
router.post("/search", async (req, res) => {
  try {
    const { provider = "copernicus-stac", aoi, bbox, startDate, endDate, collection, maxCloudCover, limit } = req.body;
    const dataProvider = getProvider(provider);

    const results = await dataProvider.search({
      aoi,
      bbox,
      startDate,
      endDate,
      collection,
      maxCloudCover,
      limit,
    });

    res.json(results);
  } catch (error: any) {
    logger.error({ error }, "Satellite imagery search failed");
    res.status(error.statusCode || 500).json({
      error: {
        code: error.code || "SEARCH_FAILED",
        message: error.message || "Failed to search satellite catalog",
        provider: error.provider,
        retryable: error.retryable,
      },
    });
  }
});

/**
 * GET /api/imagery
 * List imported imagery assets
 */
router.get("/", async (req, res) => {
  try {
    const { incidentId, dataMode } = req.query;
    let query = db.select().from(imageryAssets).orderBy(desc(imageryAssets.acquisitionTime));

    let assets;
    if (incidentId && dataMode) {
      assets = await db
        .select()
        .from(imageryAssets)
        .where(and(eq(imageryAssets.incidentId, String(incidentId)), eq(imageryAssets.dataMode, String(dataMode))))
        .orderBy(desc(imageryAssets.acquisitionTime));
    } else if (incidentId) {
      assets = await db
        .select()
        .from(imageryAssets)
        .where(eq(imageryAssets.incidentId, String(incidentId)))
        .orderBy(desc(imageryAssets.acquisitionTime));
    } else {
      assets = await query;
    }

    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/imagery/:id
 * Get single asset details
 */
router.get("/:id", async (req, res) => {
  try {
    const [asset] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, req.params.id));
    if (!asset) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Imagery asset not found" } });
    }
    res.json(asset);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/imagery/import
 * Idempotently import satellite product metadata into DB
 */
router.post("/import", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"), async (req, res) => {
  try {
    const {
      incidentId,
      externalProductId,
      provider = "COPERNICUS_STAC",
      collection,
      title,
      acquisitionTime,
      geometry,
      bbox,
      sourceUrl,
      catalogUrl,
      processingLevel,
      cloudCover,
      qualityStatus = "READY",
      dataMode = "REAL",
      metadata = {},
    } = req.body;

    if (!externalProductId || !acquisitionTime) {
      return res.status(400).json({ error: { message: "externalProductId and acquisitionTime are required" } });
    }

    const existing = await db
      .select()
      .from(imageryAssets)
      .where(and(eq(imageryAssets.provider, provider), eq(imageryAssets.externalProductId, externalProductId)));

    if (existing.length > 0) {
      // Idempotent: return existing record
      return res.json({ imported: false, asset: existing[0], message: "Asset already exists" });
    }

    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAsset = {
      id,
      incidentId: incidentId || null,
      externalProductId,
      provider,
      collection: collection || "sentinel-1-grd",
      title: title || externalProductId,
      source: provider,
      filename: `${externalProductId}.json`,
      acquisitionTime: new Date(acquisitionTime),
      geometry: geometry || null,
      bbox: bbox || null,
      sourceUrl: sourceUrl || null,
      catalogUrl: catalogUrl || null,
      processingLevel: processingLevel || "LEVEL1",
      cloudCover: typeof cloudCover === "number" ? cloudCover : null,
      qualityStatus,
      downloadStatus: "PENDING",
      processingStatus: "UNPROCESSED",
      dataMode,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(imageryAssets).values(newAsset);
    res.status(201).json({ imported: true, asset: newAsset });
  } catch (error: any) {
    logger.error({ error }, "Error importing imagery metadata");
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * POST /api/imagery/pairs
 * Pair before/after imagery for change detection
 */
router.post("/pairs", requireRole("System Admin", "Organization Admin", "Disaster Officer", "Manager", "Analyst", "Commander"), async (req, res) => {
  try {
    const { incidentId, beforeImageryId, afterImageryId } = req.body;

    if (!incidentId || !beforeImageryId || !afterImageryId) {
      return res.status(400).json({ error: { message: "incidentId, beforeImageryId, and afterImageryId are required" } });
    }

    const [before] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, beforeImageryId));
    const [after] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, afterImageryId));

    if (!before || !after) {
      return res.status(404).json({ error: { message: "One or both imagery assets not found" } });
    }

    const beforeTime = new Date(before.acquisitionTime).getTime();
    const afterTime = new Date(after.acquisitionTime).getTime();
    if (beforeTime >= afterTime) {
      return res.status(400).json({
        error: {
          code: "INVALID_TEMPORAL_ORDER",
          message: "Before imagery must be acquired prior to after imagery.",
        },
      });
    }

    const temporalDeltaHours = Math.round((afterTime - beforeTime) / (1000 * 60 * 60));
    const pairId = `pair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newPair = {
      id: pairId,
      incidentId,
      beforeImageryId,
      afterImageryId,
      overlapPercentage: 100,
      temporalDeltaHours,
      status: "VALIDATED",
      createdBy: req.session.userId,
      createdAt: new Date(),
    };

    await db.insert(imageryPairs).values(newPair);

    res.status(201).json(newPair);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/**
 * GET /api/imagery/pairs
 * List imagery pairs
 */
router.get("/pairs", async (req, res) => {
  try {
    const { incidentId } = req.query;
    if (incidentId) {
      const pairs = await db.select().from(imageryPairs).where(eq(imageryPairs.incidentId, String(incidentId)));
      return res.json(pairs);
    }
    const pairs = await db.select().from(imageryPairs);
    res.json(pairs);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
