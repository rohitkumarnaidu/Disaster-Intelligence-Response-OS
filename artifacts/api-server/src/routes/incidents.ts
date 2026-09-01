import { Router } from "express";
import { db, incidents, imageryAssets, detections, criticalAssets, cases, fieldObservations, osmCriticalAssets, fireDetections, weatherAlerts } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { eq, desc, or } from "drizzle-orm";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const allIncidents = await db.select().from(incidents).orderBy(desc(incidents.updatedAt));
  res.json(allIncidents);
});

router.post("/", requireRole("System Admin", "Organization Admin", "Disaster Officer"), async (req, res) => {
  const { id, name, disasterType, severity, aoi, description, source } = req.body;
  const newIncident = {
    id: id || `inc-${Date.now()}`,
    name,
    disasterType,
    status: "Active",
    severity,
    aoi,
    description,
    source,
    createdBy: req.session.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");
  let incidentEvent: any = null;

  await db.transaction(async (tx: any) => {
    await tx.insert(incidents).values(newIncident);
    incidentEvent = await enqueueOutboxEvent(tx, {
      eventType: "INCIDENT_CREATED",
      entityType: "INCIDENT",
      entityId: newIncident.id,
      incidentId: newIncident.id,
      version: 1,
      actorId: req.session.userId,
      payload: {
        ...newIncident,
        createdAt: newIncident.createdAt.toISOString(),
        updatedAt: newIncident.updatedAt.toISOString(),
      },
    });
  });

  if (incidentEvent) dispatchCommittedEvent(incidentEvent).catch(() => {});

  res.status(201).json(newIncident);
});

router.get("/:id", async (req, res) => {
  let incidentId = req.params.id as string;
  let [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
  if (!incident && (incidentId === "inc-demo" || incidentId === "inc-chennai-demo")) {
    [incident] = await db.select().from(incidents).orderBy(desc(incidents.updatedAt)).limit(1);
  }
  if (!incident) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Incident not found" } });
  res.json(incident);
});

router.patch("/:id", requireRole("System Admin", "Organization Admin", "Disaster Officer"), async (req, res) => {
  const { status, description, severity } = req.body;
  const incidentId = req.params.id as string;
  const updatedAt = new Date();

  const { enqueueOutboxEvent, dispatchCommittedEvent } = await import("../realtime/outbox");
  let incidentEvent: any = null;

  await db.transaction(async (tx: any) => {
    await tx.update(incidents).set({ status, description, severity, updatedAt }).where(eq(incidents.id, incidentId));
    incidentEvent = await enqueueOutboxEvent(tx, {
      eventType: "INCIDENT_UPDATED",
      entityType: "INCIDENT",
      entityId: incidentId,
      incidentId: incidentId,
      version: 1,
      actorId: req.session.userId,
      payload: {
        id: incidentId,
        status,
        description,
        severity,
        updatedAt: updatedAt.toISOString(),
      },
    });
  });

  if (incidentEvent) dispatchCommittedEvent(incidentEvent).catch(() => {});

  res.json({ success: true });
});

router.get("/:id/map", async (req, res) => {
  let incidentId = req.params.id as string;
  let [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
  if (!incident && (incidentId === "inc-demo" || incidentId === "inc-chennai-demo")) {
    [incident] = await db.select().from(incidents).orderBy(desc(incidents.updatedAt)).limit(1);
    if (incident) incidentId = incident.id;
  }
  if (!incident) return res.status(404).json({ error: { message: "Not found" } });

  function toGeoJsonGeometry(loc: any) {
    if (!loc) return null;
    if (loc.type && loc.coordinates) return loc;
    if (loc.lng !== undefined && loc.lat !== undefined) {
      return { type: "Point", coordinates: [Number(loc.lng), Number(loc.lat)] };
    }
    if (loc.longitude !== undefined && loc.latitude !== undefined) {
      return { type: "Point", coordinates: [Number(loc.longitude), Number(loc.latitude)] };
    }
    return null;
  }

  const allCases = await db.select().from(cases).leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id)).where(eq(cases.incidentId, incidentId));
  const allAssets = await db.select().from(criticalAssets);

  const casesFeatureCollection = {
    type: "FeatureCollection",
    features: allCases
      .map(c => ({ loc: toGeoJsonGeometry(c.critical_assets?.location), c }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, c }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: c.cases.id,
          status: c.cases.status,
          priority: c.cases.priorityScore,
          assetType: c.critical_assets?.type || "General"
        }
      }))
  };

  const assetsFeatureCollection = {
    type: "FeatureCollection",
    features: allAssets
      .map(a => ({ loc: toGeoJsonGeometry(a.location), a }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, a }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: a.id,
          name: a.name,
          type: a.type
        }
      }))
  };

  const allDetections = await db.select().from(detections).where(eq(detections.incidentId, incidentId));
  
  const caseIds = allCases.map(c => c.cases.id);
  let allFieldObservations: any[] = [];
  if (caseIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    allFieldObservations = await db.select().from(fieldObservations).where(inArray(fieldObservations.caseId, caseIds));
  }

  const detectionsFeatureCollection = {
    type: "FeatureCollection",
    features: allDetections
      .map(d => ({ loc: toGeoJsonGeometry(d.geometry), d }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, d }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: d.id,
          class: d.class,
          severity: d.severity,
          confidence: d.confidence
        }
      }))
  };

  const fieldObservationsFeatureCollection = {
    type: "FeatureCollection",
    features: allFieldObservations
      .map(f => ({ loc: toGeoJsonGeometry(f.location), f }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, f }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: f.id,
          caseId: f.caseId,
          status: f.verificationStatus
        }
      }))
  };

  // Query imagery assets associated with the incident or recent global coverage
  const incidentImagery = await db
    .select()
    .from(imageryAssets)
    .where(or(eq(imageryAssets.incidentId, incidentId), eq(imageryAssets.dataMode, "DEMO")))
    .orderBy(desc(imageryAssets.acquisitionTime))
    .limit(10);

  const imageryFootprintsFeatureCollection = {
    type: "FeatureCollection",
    features: incidentImagery
      .filter(img => img.geometry)
      .map(img => ({
        type: "Feature",
        geometry: img.geometry,
        properties: {
          id: img.id,
          externalProductId: img.externalProductId,
          title: img.title || img.filename,
          collection: img.collection,
          provider: img.provider,
          acquisitionTime: img.acquisitionTime,
          qualityStatus: img.qualityStatus,
        },
      })),
  };

  // Query active fire detections from NASA FIRMS
  const allFireDetections = await db
    .select()
    .from(fireDetections)
    .where(or(eq(fireDetections.incidentId, incidentId), eq(fireDetections.source, "NASA_FIRMS")))
    .orderBy(desc(fireDetections.retrievedAt))
    .limit(50);

  const fireDetectionsFeatureCollection = {
    type: "FeatureCollection",
    features: allFireDetections
      .map(f => ({ loc: toGeoJsonGeometry(f.geometry), f }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, f }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: f.id,
          externalId: f.externalId,
          brightness: f.brightness,
          confidence: f.confidence,
          frp: f.frp,
          satellite: f.satellite,
          instrument: f.instrument,
          acqTime: f.acqTime,
          source: f.source,
        },
      })),
  };

  // Query alerts associated with this incident or region
  const allAlerts = await db
    .select()
    .from(weatherAlerts)
    .where(eq(weatherAlerts.incidentId, incidentId))
    .orderBy(desc(weatherAlerts.createdAt))
    .limit(20);

  const alertsFeatureCollection = {
    type: "FeatureCollection",
    features: allAlerts
      .map(a => ({ loc: toGeoJsonGeometry(a.area), a }))
      .filter(({ loc }) => !!loc)
      .map(({ loc, a }) => ({
        type: "Feature",
        geometry: loc,
        properties: {
          id: a.id,
          headline: a.headline,
          severity: a.severity,
          alertType: a.alertType,
          source: a.source,
          effectiveAt: a.effectiveAt,
          expiresAt: a.expiresAt,
        },
      })),
  };

  const aoiObj = incident.aoi as any;
  const aoiFeature = aoiObj ? (aoiObj.type === "Feature" ? aoiObj : { type: "Feature", geometry: aoiObj, properties: {} }) : null;

  res.json({
    aoi: aoiFeature,
    cases: casesFeatureCollection,
    criticalAssets: assetsFeatureCollection,
    detections: detectionsFeatureCollection,
    fireDetections: fireDetectionsFeatureCollection,
    alerts: alertsFeatureCollection,
    fieldObservations: fieldObservationsFeatureCollection,
    imageryFootprints: imageryFootprintsFeatureCollection,
  });
});

router.get("/:id/weather", async (req, res) => {
  try {
    const incidentId = req.params.id as string;
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    if (!incident) return res.status(404).json({ error: { message: "Incident not found" } });

    let lat = 13.08;
    let lng = 80.27;

    const aoi = incident.aoi as any;
    if (aoi?.coordinates?.[0]?.[0]) {
      const firstCoord = aoi.coordinates[0][0];
      if (typeof firstCoord[0] === 'number') {
        lng = firstCoord[0];
        lat = firstCoord[1];
      }
    } else if (aoi?.coordinates && typeof aoi.coordinates[0] === 'number') {
      lng = aoi.coordinates[0];
      lat = aoi.coordinates[1];
    }

    const { fetchCurrentWeather } = await import("../lib/external-apis/openweathermap");
    const weather = await fetchCurrentWeather(lat, lng);
    res.json({ coordinates: { lat, lng }, weather });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.get("/:id/alerts", async (req, res) => {
  try {
    const incidentId = req.params.id as string;
    const { weatherAlerts } = await import("@workspace/db");
    const alerts = await db
      .select()
      .from(weatherAlerts)
      .where(eq(weatherAlerts.incidentId, incidentId));
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
