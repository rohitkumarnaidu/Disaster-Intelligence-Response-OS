import { Router } from "express";
import { incident as demoIncident, cases as demoCases, tasks as demoTasks } from "./demo-data";
import {
  db,
  incidents,
  cases,
  tasks,
  users,
  criticalAssets,
  detections,
  imageryAssets,
  reviews,
  outcomes,
  caseStatusHistory,
  auditEvents,
  evidence,
  processingJobs,
  imageryPairs,
  aiDecisionLogs,
  aiEvaluationDataset,
  osmCriticalAssets,
  weatherAlerts,
  disasterEvents,
} from "@workspace/db";
import { calculatePriority } from "../lib/priority";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { ingestionEngine } from "../services/ingestion-engine";

const router = Router();

router.post("/load", requireAuth, async (req, res) => {
  try {
    // Clean up dependent child tables in proper foreign key order
    await db.delete(aiDecisionLogs);
    await db.delete(aiEvaluationDataset);
    await db.delete(outcomes);
    await db.delete(caseStatusHistory);
    await db.delete(auditEvents);
    await db.delete(evidence);
    await db.delete(tasks);
    await db.delete(reviews);
    await db.delete(cases);
    await db.delete(detections);
    await db.delete(processingJobs);
    await db.delete(imageryPairs);
    await db.delete(imageryAssets);
    await db.delete(osmCriticalAssets);
    await db.delete(weatherAlerts);
    await db.delete(disasterEvents);
    await db.delete(criticalAssets);
    await db.delete(incidents);

    const defaultPasswordHash = "$2b$10$OXwkxMR5kG6zirq7x7FpkO5tAnvyPjOdYjOewP7PGpxZb9f4IqKki"; // demo123

    const rolesToSeed = [
      { id: "usr-analyst", name: "Alice Analyst", email: "analyst@draxelyra.local", role: "Analyst" },
      { id: "usr-field", name: "Frank Field", email: "field@draxelyra.local", role: "Field Responder" },
      { id: "usr-manager", name: "Mary Manager", email: "manager@draxelyra.local", role: "Manager" },
      { id: "usr-commander", name: "Cole Commander", email: "commander@draxelyra.local", role: "Commander" },
      { id: "usr-orgadmin", name: "Olivia OrgAdmin", email: "orgadmin@draxelyra.local", role: "Organization Admin" },
      { id: "usr-sysadmin", name: "Sam SysAdmin", email: "admin@draxelyra.local", role: "System Admin" }
    ];

    for (const r of rolesToSeed) {
      const existing = await db.select().from(users).where(eq(users.email, r.email));
      if (existing.length === 0) {
        await db.insert(users).values({ ...r, passwordHash: defaultPasswordHash });
      }
    }

    // Seed Incident
    await db.insert(incidents).values({
      id: demoIncident.id,
      name: demoIncident.name,
      disasterType: demoIncident.disasterType,
      status: demoIncident.status,
      severity: demoIncident.severity,
      source: demoIncident.source,
      description: demoIncident.description,
      aoi: demoIncident.aoi,
      startTime: new Date(demoIncident.startTime),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Satellite Imagery Assets (Pre & Post flood)
    const beforeDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const afterDate = new Date();

    await db.insert(imageryAssets).values({
      id: "img-demo-pre",
      incidentId: "inc-chennai-demo",
      externalProductId: "S1A_IW_GRDH_1SDV_20260816T123456_PRE_DEMO",
      provider: "DEMO",
      collection: "sentinel-1-grd",
      title: "Pre-Flood SAR Baseline — Sentinel-1A",
      source: "DEMO_REPLAY",
      acquisitionTime: beforeDate,
      geometry: { type: "Polygon", coordinates: [[[80.15, 12.95], [80.32, 12.95], [80.32, 13.15], [80.15, 13.15], [80.15, 12.95]]] },
      bbox: [80.15, 12.95, 80.32, 13.15],
      qualityStatus: "READY",
      processingStatus: "PROCESSED",
      dataMode: "DEMO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(imageryAssets).values({
      id: "img-demo-post",
      incidentId: "inc-chennai-demo",
      externalProductId: "S1A_IW_GRDH_1SDV_20260828T123456_POST_DEMO",
      provider: "DEMO",
      collection: "sentinel-1-grd",
      title: "Post-Flood SAR Assessment — Sentinel-1A",
      source: "DEMO_REPLAY",
      acquisitionTime: afterDate,
      geometry: { type: "Polygon", coordinates: [[[80.15, 12.95], [80.32, 12.95], [80.32, 13.15], [80.15, 13.15], [80.15, 12.95]]] },
      bbox: [80.15, 12.95, 80.32, 13.15],
      qualityStatus: "READY",
      processingStatus: "PROCESSED",
      dataMode: "DEMO",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const c of demoCases) {
      const cScore = 
        c.assetType === 'Hospital' ? 100 :
        c.assetType === 'Emergency' ? 100 :
        c.assetType === 'Bridge' ? 85 :
        c.assetType === 'Utility' ? 75 :
        c.assetType === 'School' ? 70 :
        c.assetType === 'Government' ? 60 : 50;

      const popTier = 
        ['Hospital', 'School', 'Residential'].includes(c.assetType) ? 'High' :
        ['Bridge', 'Utility', 'Commercial'].includes(c.assetType) ? 'Medium' : 'Low';

      await db.insert(criticalAssets).values({
        id: 'ast-' + c.id,
        name: c.assetName,
        type: c.assetType,
        location: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
        criticalityScore: cScore,
        populationExposureTier: popTier,
        osmId: 'osm-' + c.id
      });

      await db.insert(detections).values({
        id: 'det-' + c.id,
        incidentId: demoIncident.id,
        imageryId: 'img-demo-post',
        geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
        class: c.severity === 'No damage' ? 'No damage' : 'Structure damage',
        severity: c.severity,
        confidence: c.confidence,
        modelName: "Sentinel-1 SAR Flood Classifier",
        modelVersion: "v2.4.1",
        inferenceTimestamp: new Date(),
      });

      const mapStatus = (status: string) => {
        if (status === 'review') return 'NEEDS_REVIEW';
        if (status === 'tasked') return 'TASKED';
        if (status === 'verified') return 'VERIFIED';
        if (status === 'closed') return 'CLOSED';
        return 'NEEDS_REVIEW';
      };

      const mapReviewState = (state: string) => {
        if (state === 'Needs review') return 'UNREVIEWED';
        if (state === 'Confirmed') return 'CONFIRMED';
        if (state === 'Rejected') return 'REJECTED';
        if (state === 'Uncertain') return 'UNCERTAIN';
        return 'UNREVIEWED';
      };

      await db.insert(cases).values({
        id: c.id,
        incidentId: demoIncident.id,
        detectionId: 'det-' + c.id,
        assetId: 'ast-' + c.id,
        status: mapStatus(c.status),
        priorityScore: c.priorityScore,
        priorityBreakdown: c.factors,
        reviewState: mapReviewState(c.reviewState),
        dataMode: 'DEMO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    for (const t of demoTasks) {
      const mapTaskStatus = (status: string) => {
        if (status === 'Open') return 'ASSIGNED';
        if (status === 'In progress') return 'IN_PROGRESS';
        if (status === 'Completed') return 'COMPLETED';
        return 'ASSIGNED';
      };

      await db.insert(tasks).values({
        id: t.id,
        caseId: t.caseId,
        title: t.title,
        priority: t.priority,
        assignedTeam: t.assignedTeam,
        assignedUser: t.assignedUser ? "usr-field" : null,
        status: mapTaskStatus(t.status),
        dueAt: new Date(t.dueAt),
        createdAt: new Date()
      });
    }

    // Seed Evidence
    await db.insert(evidence).values({
      id: "ev-demo-1",
      caseId: "case-hero-hospital",
      type: "SAR_COHERENCE_MAP",
      uri: "/demo-imagery/post-flood-s1.png",
      source: "DEMO_REPLAY",
      mimeType: "image/png",
      metadata: { note: "Deterministic pre/post SAR backscatter drop" },
      timestamp: new Date(),
    });

    await Promise.allSettled([
      (ingestionEngine as any).ingestEarthquakes(),
      (ingestionEngine as any).ingestGDACS(),
      (ingestionEngine as any).ingestWeatherAlerts(),
      (ingestionEngine as any).ingestEONET()
    ]);

    res.json({ success: true, message: `Demo incident loaded with ${demoCases.length} cases and ${demoTasks.length} tasks` });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.post("/reset", requireAuth, async (req, res) => {
  res.redirect(307, "/api/demo/load");
});

router.post("/load-live", requireAuth, async (req, res) => {
  try {
    await Promise.allSettled([
      (ingestionEngine as any).ingestEarthquakes(),
      (ingestionEngine as any).ingestGDACS(),
      (ingestionEngine as any).ingestWeatherAlerts(),
      (ingestionEngine as any).ingestEONET()
    ]);
    res.json({ success: true, message: "Live feeds synchronized" });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

export default router;
