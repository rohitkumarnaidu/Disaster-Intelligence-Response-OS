import { Router } from "express";
import { db, externalFeeds, disasterEvents } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { desc, eq } from "drizzle-orm";
import { ingestionEngine } from "../services/ingestion-engine";

const router = Router();
router.use(requireAuth);

/** GET /api/feeds — List all external data feeds with sync status */
router.get("/", async (_req, res) => {
  try {
    const feeds = await db
      .select()
      .from(externalFeeds)
      .orderBy(desc(externalFeeds.lastSyncAt));
    res.json(feeds);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** GET /api/feeds/:id — Get feed details + recent events */
router.get("/:id", async (req, res) => {
  try {
    const feedId = req.params.id as string;
    const [feed] = await db
      .select()
      .from(externalFeeds)
      .where(eq(externalFeeds.id, feedId));

    if (!feed) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Feed not found" } });
    }

    // Get recent events from this source
    const events = await db
      .select()
      .from(disasterEvents)
      .where(eq(disasterEvents.source, feed.source))
      .orderBy(desc(disasterEvents.createdAt))
      .limit(10);

    res.json({ feed, recentEvents: events });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** POST /api/feeds/:id/sync — Manually trigger a feed sync */
router.post("/:id/sync", requireRole("System Admin", "Organization Admin"), async (req, res) => {
  try {
    const feedId = req.params.id as string;
    const [feed] = await db
      .select()
      .from(externalFeeds)
      .where(eq(externalFeeds.id, feedId));

    if (!feed) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Feed not found" } });
    }

    // Trigger manual sync based on feed type
    const syncMap: Record<string, () => Promise<void>> = {
      earthquake: () => (ingestionEngine as any).ingestEarthquakes(),
      disaster: () => (ingestionEngine as any).ingestGDACS(),
      weather: () => (ingestionEngine as any).ingestWeatherAlerts(),
      natural_event: () => (ingestionEngine as any).ingestEONET(),
    };

    const syncFn = syncMap[feed.feedType];
    if (syncFn) {
      // Run async — don't block the response
      syncFn().catch((err) => {
        console.error(`Manual sync error for feed ${feedId}:`, err);
      });
    }

    // Update last sync time
    await db
      .update(externalFeeds)
      .set({ lastSyncAt: new Date() })
      .where(eq(externalFeeds.id, feedId));

    res.json({ success: true, message: `Sync triggered for ${feed.source}` });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

/** PATCH /api/feeds/:id — Update feed config (pause/resume) */
router.patch("/:id", requireRole("System Admin", "Organization Admin"), async (req, res) => {
  try {
    const feedId = req.params.id as string;
    const { status, config } = req.body;

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (config) updates.config = config;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: "No valid fields to update" } });
    }

    await db
      .update(externalFeeds)
      .set(updates)
      .where(eq(externalFeeds.id, feedId));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
