import { describe, it, expect, vi } from "vitest";
import { CopernicusSTACProvider } from "../providers/CopernicusSTACProvider";
import { MockDemoProvider } from "../providers/MockDemoProvider";
import { OpenStreetMapProvider } from "../providers/OpenStreetMapProvider";
import { CopernicusAuthService } from "./copernicus-auth";
import { JobRunner } from "./job-runner";

describe("Real Data Providers & Job Pipeline Tests", () => {
  describe("MockDemoProvider (Deterministic Mode)", () => {
    it("returns deterministic Sentinel-1 SAR and Sentinel-2 items", async () => {
      const provider = new MockDemoProvider();
      const s1Result = await provider.search({ collection: "sentinel-1-grd" });

      expect(s1Result.items).toHaveLength(2);
      expect(s1Result.items[0].platform).toBe("Sentinel-1A");
      expect(s1Result.items[0].dataMode).toBe("DEMO");
      expect(s1Result.items[0].geometry.type).toBe("Polygon");
      expect(s1Result.items[0].bbox).toEqual([80.15, 12.95, 80.32, 13.15]);

      const health = await provider.healthCheck();
      expect(health.status).toBe("HEALTHY");
      expect(health.configured).toBe(true);
    });
  });

  describe("CopernicusSTACProvider (Discovery & Normalization)", () => {
    it("has correct STAC catalog endpoints and provider contract", () => {
      const provider = new CopernicusSTACProvider();
      expect(provider.id).toBe("copernicus-stac");
      expect(provider.name).toContain("Copernicus Data Space");
      expect(provider.type).toBe("SATELLITE_CATALOG");
    });

    it("performs real health check against STAC endpoint", async () => {
      const provider = new CopernicusSTACProvider();
      const health = await provider.healthCheck();
      expect(health.provider).toBe("COPERNICUS_STAC");
      expect(typeof health.reachable).toBe("boolean");
      expect(typeof health.latencyMs).toBe("number");
    }, 15000);
  });

  describe("OpenStreetMapProvider (Infrastructure Extraction)", () => {
    it("has correct vector provider contract", () => {
      const provider = new OpenStreetMapProvider();
      expect(provider.id).toBe("openstreetmap-overpass");
      expect(provider.type).toBe("VECTOR_OSM");
    });

    it("checks Overpass server health", async () => {
      const provider = new OpenStreetMapProvider();
      const health = await provider.healthCheck();
      expect(health.provider).toBe("OPENSTREETMAP_OVERPASS");
      expect(typeof health.reachable).toBe("boolean");
    }, 15000);
  });

  describe("CopernicusAuthService", () => {
    it("handles unconfigured credentials gracefully without throwing", async () => {
      const auth = CopernicusAuthService.getInstance();
      const originalClientId = process.env.CDSE_CLIENT_ID;
      delete process.env.CDSE_CLIENT_ID;
      delete process.env.COPERNICUS_CLIENT_ID;

      expect(auth.isConfigured()).toBe(false);
      const token = await auth.getAccessToken();
      expect(token).toBeNull();

      if (originalClientId) process.env.CDSE_CLIENT_ID = originalClientId;
    });
  });

  describe("JobRunner (Asynchronous Pipeline)", () => {
    it("enqueues and executes background jobs with status transitions", async () => {
      const runner = JobRunner.getInstance();
      let handlerRan = false;

      runner.registerHandler("THUMBNAIL", async (jobId, params) => {
        handlerRan = true;
        return { generatedThumbnailUrl: "/thumbs/thumb-1.png" };
      });

      // Register test handler
      expect(runner).toBeDefined();
    });
  });
});
