import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { realtimeGateway, outboxProcessor } from "../realtime";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/realtime", async (_req, res) => {
  try {
    const summary = realtimeGateway.getHealthSummary();
    let dbStatus = "HEALTHY";
    try {
      await pool.query("SELECT 1");
    } catch {
      dbStatus = "UNHEALTHY";
    }

    res.json({
      status: dbStatus === "HEALTHY" ? "HEALTHY" : "DEGRADED",
      database: dbStatus,
      transport: "WebSocket",
      endpoint: "/ws",
      gateway: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.post("/realtime/replay", async (req, res) => {
  try {
    const { sinceTimestamp, incidentId, entityType, limit } = req.body;
    const sinceDate = sinceTimestamp ? new Date(sinceTimestamp) : new Date(Date.now() - 3600 * 1000);
    const events = await outboxProcessor.getEventsSince(sinceDate, {
      incidentId,
      entityType,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ events, count: events.length });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;

