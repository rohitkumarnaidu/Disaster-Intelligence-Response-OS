import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import path from "path";
import fs from "fs";
import { logger } from "./lib/logger";

const app: Express = express();
const PgSession = connectPgSimple(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "draxelyra_default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);

// Serve production frontend single-page application (SPA)
const frontendDistPaths = [
  path.resolve(process.cwd(), "artifacts/draxelyra/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(import.meta.dirname, "../../../artifacts/draxelyra/dist/public"),
  path.resolve(import.meta.dirname, "../../draxelyra/dist/public"),
];

let frontendServed = false;
for (const distPath of frontendDistPaths) {
  if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api|\/ws|\/uploads).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    frontendServed = true;
    break;
  }
}

if (!frontendServed) {
  app.get("/", (_req, res) => {
    res.json({
      name: "DRAXELYRA Disaster Intelligence & Response OS API",
      status: "ONLINE",
      version: "2.0.0",
      health: "/api/healthz",
    });
  });
}

export default app;


