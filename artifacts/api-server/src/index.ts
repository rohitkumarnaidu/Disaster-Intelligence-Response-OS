import fs from "fs";
import path from "path";

// Automatically load .env file from workspace root if present
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Ignore env file read errors
}

import app from "./app";
import { logger } from "./lib/logger";
import { ingestionEngine } from "./services/ingestion-engine";
import { realtimeGateway, outboxProcessor } from "./realtime";

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const host = process.env["HOST"] || "0.0.0.0";

const server = app.listen(port, host, () => {
  logger.info({ port, host }, "DRAXELYRA Response OS server listening");
  realtimeGateway.initialize(server);
  outboxProcessor.start(3000);
  ingestionEngine.start();
});

function gracefulShutdown() {
  logger.info("Shutting down gracefully...");
  ingestionEngine.stop();
  outboxProcessor.stop();
  realtimeGateway.shutdown();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

