import crypto from "crypto";
import { logger } from "../logger";

export interface SachetDisasterAlert {
  alertId: string;
  headline: string;
  event: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  effective: Date;
  expires: Date;
  areaDesc: string;
  geometry?: {
    type: "Polygon" | "Point";
    coordinates: any;
  } | null;
  source: "SACHET_NDMA" | "IMD" | "SDMA";
  sourceUrl: string;
  retrievedAt: Date;
  rawHash: string;
  stateOrRegion?: string;
  instruction?: string;
  rawPayload: any;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Parses simple CAP XML / RSS text into normalized alert objects
 */
function parseCapRssXml(xmlText: string): SachetDisasterAlert[] {
  const alerts: SachetDisasterAlert[] = [];
  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  const extractTag = (itemStr: string, tagName: string): string => {
    const match = itemStr.match(new RegExp(`<(${tagName}|cap:${tagName})[^>]*>([\\s\\S]*?)<\\/(${tagName}|cap:${tagName})>`, "i"));
    if (match && match[2]) {
      return match[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
    }
    return "";
  };

  for (const item of itemMatches) {
    const title = extractTag(item, "title") || extractTag(item, "headline");
    const description = extractTag(item, "description") || extractTag(item, "summary");
    const link = extractTag(item, "link") || "https://sachet.ndma.gov.in";
    const pubDateStr = extractTag(item, "pubDate") || extractTag(item, "updated") || extractTag(item, "effective");
    const event = extractTag(item, "event") || "Severe Weather / Cyclone";
    const severityRaw = extractTag(item, "severity") || "Severe";
    const urgencyRaw = extractTag(item, "urgency") || "Expected";
    const certaintyRaw = extractTag(item, "certainty") || "Likely";
    const areaDesc = extractTag(item, "areaDesc") || extractTag(item, "area") || "India";
    const polygonStr = extractTag(item, "polygon");
    const circleStr = extractTag(item, "circle");
    const instruction = extractTag(item, "instruction");
    const identifier = extractTag(item, "identifier") || extractTag(item, "guid") || crypto.createHash("md5").update(title + pubDateStr).digest("hex");

    let severity: SachetDisasterAlert["severity"] = "Severe";
    const sevUpper = severityRaw.toUpperCase();
    if (sevUpper.includes("EXTREME")) severity = "Extreme";
    else if (sevUpper.includes("SEVERE")) severity = "Severe";
    else if (sevUpper.includes("MODERATE")) severity = "Moderate";
    else if (sevUpper.includes("MINOR")) severity = "Minor";

    let urgency: SachetDisasterAlert["urgency"] = "Expected";
    if (urgencyRaw.toUpperCase().includes("IMMEDIATE")) urgency = "Immediate";
    else if (urgencyRaw.toUpperCase().includes("FUTURE")) urgency = "Future";

    let certainty: SachetDisasterAlert["certainty"] = "Likely";
    if (certaintyRaw.toUpperCase().includes("OBSERVED")) certainty = "Observed";
    else if (certaintyRaw.toUpperCase().includes("POSSIBLE")) certainty = "Possible";

    let geometry: SachetDisasterAlert["geometry"] = null;
    if (polygonStr) {
      const pairs = polygonStr.trim().split(/\s+/).map((pair) => {
        const [latStr, lonStr] = pair.split(",");
        return [parseFloat(lonStr), parseFloat(latStr)];
      }).filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat));

      if (pairs.length >= 3) {
        if (pairs[0][0] !== pairs[pairs.length - 1][0] || pairs[0][1] !== pairs[pairs.length - 1][1]) {
          pairs.push([...pairs[0]]);
        }
        geometry = {
          type: "Polygon",
          coordinates: [pairs],
        };
      }
    } else if (circleStr) {
      const parts = circleStr.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          geometry = {
            type: "Point",
            coordinates: [lon, lat],
          };
        }
      }
    }

    const effectiveDate = pubDateStr ? new Date(pubDateStr) : new Date();
    const expiresDate = new Date(effectiveDate.getTime() + 24 * 60 * 60 * 1000);
    const rawHash = crypto.createHash("sha256").update(item).digest("hex");

    alerts.push({
      alertId: `sachet-${identifier}`,
      headline: title || `${event} Warning - ${areaDesc}`,
      event,
      severity,
      urgency,
      certainty,
      effective: effectiveDate,
      expires: expiresDate,
      areaDesc,
      geometry,
      source: "SACHET_NDMA",
      sourceUrl: link,
      retrievedAt: new Date(),
      rawHash,
      instruction,
      rawPayload: { title, description, areaDesc, polygon: polygonStr, event, severity: severityRaw },
    });
  }

  return alerts;
}

/**
 * Fetches India CAP disaster alerts from SACHET (NDMA)
 */
export async function fetchSachetAlerts(): Promise<SachetDisasterAlert[]> {
  const sachetFeedUrl = process.env.SACHET_FEED_URL || "https://sachet.ndma.gov.in/cap_feed/rss.xml";

  try {
    const response = await fetchWithTimeout(sachetFeedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "DRAXELYRA-Disaster-OS/1.0",
      },
    }, 6000);

    if (response.ok) {
      const xmlText = await response.text();
      const parsedAlerts = parseCapRssXml(xmlText);
      if (parsedAlerts.length > 0) {
        return parsedAlerts;
      }
    }
  } catch (err: any) {
    logger.warn({ err: err.message, url: sachetFeedUrl }, "Could not reach live SACHET feed directly");
  }

  return [];
}
