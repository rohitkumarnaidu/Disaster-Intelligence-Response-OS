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

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/incidents", incidentsRouter);
router.use("/cases", casesRouter);
router.use("/tasks", tasksRouter);
router.use("/analytics", analyticsRouter);
router.use("/demo", demoRouter);
router.use("/evidence", evidenceRouter);
router.use("/", operationsRouter);

export default router;

