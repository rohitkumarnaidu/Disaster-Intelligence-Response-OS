import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { checkAllDataSourcesHealth, checkSingleDataSourceHealth, initializeDataSources } from "../services/data-sources";
import { db, dataSources } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  try {
    await initializeDataSources();
    let sources = await db.select().from(dataSources);
    if (sources.length === 0) {
      const liveHealth = await checkAllDataSourcesHealth();
      sources = await db.select().from(dataSources);
      if (sources.length === 0) {
        return res.json(liveHealth);
      }
    }

    res.json(sources);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.get("/health", async (_req, res) => {
  try {
    const health = await checkAllDataSourcesHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.get("/:id/health", async (req, res) => {
  try {
    const health = await checkSingleDataSourceHealth(req.params.id);
    res.json(health);
  } catch (error: any) {
    res.status(404).json({ error: { message: error.message } });
  }
});

export default router;
