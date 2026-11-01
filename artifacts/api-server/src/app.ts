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
app.set("trust proxy", 1);
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

// Explicit CORS origin validation
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS policy"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: SESSION_SECRET must be configured in production.");
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "draxelyra_dev_session_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
