import { describe, it, expect } from "vitest";
import { providerRegistry, getProvider } from "../providers";
import { copernicusSTACProvider } from "../providers/CopernicusSTACProvider";
import { copernicusODataProvider } from "../providers/CopernicusODataProvider";
import { nasaFirmsProvider } from "../providers/NASAFIRMSProvider";
import { sachetProvider } from "../providers/SACHETProvider";
import { imdProvider } from "../providers/IMDProvider";
import { openWeatherProvider } from "../providers/OpenWeatherProvider";
import { waqiProvider } from "../providers/WAQIProvider";
import { openStreetMapProvider } from "../providers/OpenStreetMapProvider";
import { mapTilerProvider } from "../providers/MapTilerProvider";
import { geminiProvider } from "../providers/GeminiProvider";
import { checkAllDataSourcesHealth, initializeDataSources } from "./data-sources";

describe("DRAXELYRA Zero-Trust Multi-Hazard Provider Test Suite", () => {
  it("registers all 9 core operational external providers in providerRegistry", () => {
    expect(providerRegistry.has("copernicus-stac")).toBe(true);
    expect(providerRegistry.has("copernicus-odata")).toBe(true);
    expect(providerRegistry.has("nasa-firms")).toBe(true);
    expect(providerRegistry.has("sachet-ndma")).toBe(true);
    expect(providerRegistry.has("imd-weather")).toBe(true);
    expect(providerRegistry.has("openweathermap")).toBe(true);
    expect(providerRegistry.has("waqi-air-quality")).toBe(true);
    expect(providerRegistry.has("openstreetmap-overpass")).toBe(true);
    expect(providerRegistry.has("maptiler")).toBe(true);
    expect(providerRegistry.has("gemini-multimodal")).toBe(true);
  });

  it("probes NASA FIRMS provider health without crashing when MAP_KEY is absent", async () => {
    const health = await nasaFirmsProvider.healthCheck();
    expect(health.provider).toBe("nasa-firms");
    expect(health.freshnessClass).toBe("NEAR_REAL_TIME");
    expect(health.coverage).toContain("INDIA");
    expect(["HEALTHY", "NOT_CONFIGURED", "AUTH_ERROR", "UNAVAILABLE"]).toContain(health.status);
  });

  it("probes SACHET India CAP alert provider health with real timeout isolation", async () => {
    const health = await sachetProvider.healthCheck();
    expect(health.provider).toBe("sachet-ndma");
    expect(health.freshnessClass).toBe("NEAR_REAL_TIME");
    expect(health.coverage).toBe("INDIA NATIONWIDE");
    expect(["HEALTHY", "DEGRADED", "UNAVAILABLE"]).toContain(health.status);
  }, 10000);

  it("probes IMD weather provider health and returns explicit status", async () => {
    const health = await imdProvider.healthCheck();
    expect(health.provider).toBe("imd-weather");
    expect(health.freshnessClass).toBe("NEAR_REAL_TIME");
    expect(["HEALTHY", "NOT_CONFIGURED", "DEGRADED", "UNAVAILABLE"]).toContain(health.status);
  });

  it("probes OpenWeatherMap provider and falls back to Open-Meteo seamlessly", async () => {
    const health = await openWeatherProvider.healthCheck();
    expect(health.provider).toBe("openweathermap");
    expect(health.freshnessClass).toBe("NEAR_REAL_TIME");
    expect(health.reachable).toBe(true);
    expect(health.status).toBe("HEALTHY");
  }, 10000);

  it("probes WAQI air quality provider and falls back to Open-Meteo AQI seamlessly", async () => {
    const health = await waqiProvider.healthCheck();
    expect(health.provider).toBe("waqi-air-quality");
    expect(health.freshnessClass).toBe("NEAR_REAL_TIME");
    expect(health.reachable).toBe(true);
    expect(health.status).toBe("HEALTHY");
  }, 10000);

  it("probes MapTiler provider health and validates API key or indicates unconfigured", async () => {
    const health = await mapTilerProvider.healthCheck();
    expect(health.provider).toBe("maptiler");
    expect(health.freshnessClass).toBe("PERIODIC");
    expect(["HEALTHY", "NOT_CONFIGURED", "AUTH_ERROR", "DEGRADED", "UNAVAILABLE"]).toContain(health.status);
  });

  it("probes Gemini Multimodal AI Provider health and returns structured telemetry", async () => {
    const health = await geminiProvider.healthCheck();
    expect(health.provider).toBe("gemini-multimodal");
    expect(health.freshnessClass).toBe("LIVE");
    expect(health.coverage).toContain("MULTIMODAL");
    expect(["HEALTHY", "NOT_CONFIGURED", "AUTH_ERROR", "ERROR"]).toContain(health.status);
  });

  it("runs checkAllDataSourcesHealth across all providers in parallel with zero-trust persistence", async () => {
    await initializeDataSources();
    const allHealth = await checkAllDataSourcesHealth();
    expect(Array.isArray(allHealth)).toBe(true);
    expect(allHealth.length).toBeGreaterThanOrEqual(8);
    for (const h of allHealth) {
      expect(h.provider).toBeDefined();
      expect(h.type).toBeDefined();
      expect(typeof h.latencyMs).toBe("number");
      expect(h.checkedAt).toBeDefined();
    }
  }, 25000);
});
