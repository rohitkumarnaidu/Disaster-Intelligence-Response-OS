import { describe, it, expect } from "vitest";
import { fetchCurrentWeather } from "../lib/external-apis/openweathermap";
import { fetchAirQuality } from "../lib/external-apis/waqi-air-quality";
import { calculatePriority } from "../lib/priority";

describe("India Multi-Hazard Operations & Spatial Telemetry Test Suite", () => {
  const INDIA_KEY_REGIONS = [
    { name: "Chennai", lat: 13.0827, lng: 80.2707, primaryHazard: "Flood / Cyclone" },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, primaryHazard: "Urban Inundation" },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639, primaryHazard: "Severe Storm / Surge" },
    { name: "Guwahati", lat: 26.1445, lng: 91.7362, primaryHazard: "Riverine Flood" },
    { name: "Kochi", lat: 9.9312, lng: 76.2673, primaryHazard: "Coastal Surge" },
    { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, primaryHazard: "Severe AQI / Heat" },
    { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, primaryHazard: "Tropical Cyclone" },
    { name: "Wayanad", lat: 11.6854, lng: 76.1320, primaryHazard: "Monsoon Landslide" },
    { name: "Shimla", lat: 31.1048, lng: 77.1734, primaryHazard: "Flash Flood / Landslide" },
    { name: "Dehradun", lat: 30.3165, lng: 78.0322, primaryHazard: "Cloudburst" },
  ];

  it("successfully retrieves live weather telemetry across all 10 Indian operational centers", async () => {
    for (const region of INDIA_KEY_REGIONS) {
      const weather = await fetchCurrentWeather(region.lat, region.lng);
      expect(weather).not.toBeNull();
      expect(typeof weather?.temperature).toBe("number");
      expect(typeof weather?.humidity).toBe("number");
      expect(typeof weather?.windSpeed).toBe("number");
      expect(weather?.weatherMain).toBeDefined();
    }
  }, 30000);

  it("successfully retrieves live air quality across all 10 Indian operational centers", async () => {
    for (const region of INDIA_KEY_REGIONS) {
      const aqi = await fetchAirQuality(region.lat, region.lng);
      expect(aqi).not.toBeNull();
      expect(typeof aqi?.aqi).toBe("number");
      expect(typeof aqi?.pm25).toBe("number");
      expect(aqi?.category).toBeDefined();
    }
  }, 30000);

  it("correctly computes deterministic priority scores for multi-hazard Indian scenarios", () => {
    // Scenario 1: Wayanad Landslide near Major Medical Center
    const landslideHospital = calculatePriority("Severe", "Hospital", "High", 4.0, true, 0.92);
    expect(landslideHospital.score).toBeGreaterThanOrEqual(80);

    // Scenario 2: Chennai Inundation near Substation
    const chennaiSubstation = calculatePriority("Severe", "Substation", "High", 12.0, true, 0.85);
    expect(chennaiSubstation.score).toBeGreaterThanOrEqual(75);

    // Scenario 3: Minor tree fall in residential zone
    const minorIncident = calculatePriority("Minor", "Commercial", "Low", 48.0, false, 0.40);
    expect(minorIncident.score).toBeLessThan(45);
  });
});
