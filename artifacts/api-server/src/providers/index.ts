export * from "./DataProvider";
export * from "./CopernicusSTACProvider";
export * from "./CopernicusODataProvider";
export * from "./SentinelProcessingProvider";
export * from "./NASAFIRMSProvider";
export * from "./SACHETProvider";
export * from "./IMDProvider";
export * from "./OpenWeatherProvider";
export * from "./WAQIProvider";
export * from "./OpenStreetMapProvider";
export * from "./MapTilerProvider";
export * from "./GeminiProvider";
export * from "./MockDemoProvider";

import { DataProvider } from "./DataProvider";
import { copernicusSTACProvider } from "./CopernicusSTACProvider";
import { copernicusODataProvider } from "./CopernicusODataProvider";
import { sentinelProcessingProvider } from "./SentinelProcessingProvider";
import { nasaFirmsProvider } from "./NASAFIRMSProvider";
import { sachetProvider } from "./SACHETProvider";
import { imdProvider } from "./IMDProvider";
import { openWeatherProvider } from "./OpenWeatherProvider";
import { waqiProvider } from "./WAQIProvider";
import { openStreetMapProvider } from "./OpenStreetMapProvider";
import { mapTilerProvider } from "./MapTilerProvider";
import { geminiProvider } from "./GeminiProvider";
import { mockDemoProvider } from "./MockDemoProvider";

export const providerRegistry = new Map<string, DataProvider>([
  ["copernicus-stac", copernicusSTACProvider],
  ["COPERNICUS_STAC", copernicusSTACProvider],
  ["copernicus-odata", copernicusODataProvider],
  ["COPERNICUS_ODATA", copernicusODataProvider],
  ["sentinel-hub-process", sentinelProcessingProvider],
  ["SENTINEL_HUB", sentinelProcessingProvider],
  ["nasa-firms", nasaFirmsProvider],
  ["NASA_FIRMS", nasaFirmsProvider],
  ["sachet-ndma", sachetProvider],
  ["SACHET_NDMA", sachetProvider],
  ["imd-weather", imdProvider],
  ["IMD_WEATHER", imdProvider],
  ["openweathermap", openWeatherProvider],
  ["OPENWEATHERMAP", openWeatherProvider],
  ["waqi-air-quality", waqiProvider],
  ["WAQI", waqiProvider],
  ["openstreetmap-overpass", openStreetMapProvider],
  ["OPENSTREETMAP_OVERPASS", openStreetMapProvider],
  ["maptiler", mapTilerProvider],
  ["MAPTILER", mapTilerProvider],
  ["gemini-multimodal", geminiProvider],
  ["GEMINI_MULTIMODAL", geminiProvider],
  ["demo", mockDemoProvider],
  ["DEMO", mockDemoProvider],
]);

export function getProvider(idOrKey: string): DataProvider {
  const provider = providerRegistry.get(idOrKey);
  if (!provider) {
    return idOrKey.toLowerCase().includes("demo") ? mockDemoProvider : copernicusSTACProvider;
  }
  return provider;
}
