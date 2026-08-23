import { Router } from "express";
import { db, incidents, imageryAssets, detections, criticalAssets, cases, fieldObservations } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { eq, desc } from "drizzle-orm";

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
  await db.insert(incidents).values(newIncident);
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
  await db.update(incidents).set({ status, description, severity, updatedAt: new Date() }).where(eq(incidents.id, req.params.id as string));
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

  const aoiObj = incident.aoi as any;
  const aoiFeature = aoiObj ? (aoiObj.type === "Feature" ? aoiObj : { type: "Feature", geometry: aoiObj, properties: {} }) : null;

  res.json({
    aoi: aoiFeature,
    cases: casesFeatureCollection,
    criticalAssets: assetsFeatureCollection,
    detections: detectionsFeatureCollection,
    fieldObservations: fieldObservationsFeatureCollection
  });
});

export default router;


