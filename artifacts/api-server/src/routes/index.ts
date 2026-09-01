import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import incidentsRouter from "./incidents";
import casesRouter from "./cases";
import tasksRouter from "./tasks";
import analyticsRouter from "./analytics";
import demoRouter from "./demo";
import evidenceRouter from "./evidence";
import operationsRouter from "./operations";
import weatherRouter from "./weather";
import feedsRouter from "./feeds";
import dataSourcesRouter from "./data-sources";
import imageryRouter from "./imagery";
import processingRouter from "./processing";
import integrationsRouter from "./integrations";
import aiRouter from "./ai";
import { eventBus } from "../services/event-emitter";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => res.json({ status: "ok" }));
router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/incidents", incidentsRouter);
router.use("/cases", casesRouter);
router.use("/tasks", tasksRouter);
router.use("/analytics", analyticsRouter);
router.use("/demo", demoRouter);
router.use("/evidence", evidenceRouter);
router.use("/weather", weatherRouter);
router.use("/feeds", feedsRouter);
router.use("/data-sources", dataSourcesRouter);
router.use("/imagery", imageryRouter);
router.use("/processing", processingRouter);
router.use("/integrations", integrationsRouter);
router.use("/ai", aiRouter);

router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  eventBus.addClient(res);
});

router.use("/", operationsRouter);

export default router;
