import { Router } from "express";
import { db, incidents, cases, tasks, users, criticalAssets, detections, imageryAssets, reviews, outcomes, caseStatusHistory, auditEvents, evidence } from "@workspace/db";
import { calculatePriority } from "../lib/priority";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/load", requireAuth, async (req, res) => {
  try {
    // Clean up dependent child tables in proper foreign key order
    await db.delete(outcomes);
    await db.delete(caseStatusHistory);
    await db.delete(auditEvents);
    await db.delete(evidence);
    await db.delete(tasks);
    await db.delete(reviews);
    await db.delete(cases);
    await db.delete(detections);
    await db.delete(imageryAssets);
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
      id: "inc-chennai-demo",
      name: "Chennai Urban Flood — Demo Replay",
      disasterType: "Urban flood",
      status: "Active",
      severity: "high",
      source: "DEMO REPLAY / HISTORICAL",
      description: "Fictionalized historical monsoon scenario for operational demonstration.",
      aoi: { type: "Polygon", coordinates: [[[80.15, 13], [80.3, 13], [80.3, 13.15], [80.15, 13.15], [80.15, 13]]] },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Critical Asset (Hospital)
    await db.insert(criticalAssets).values({
      id: "ast-hosp-1",
      name: "General Hospital",
      type: "Hospital",
      location: { lat: 13.08, lng: 80.27 },
      criticalityScore: 100,
      populationExposureTier: "High"
    });

    // Seed Detection
    await db.insert(detections).values({
      id: "det-1",
      incidentId: "inc-chennai-demo",
      geometry: { lat: 13.08, lng: 80.27 },
      class: "Structure damage",
      severity: "Severe",
      confidence: 0.55,
      modelName: "change-detector",
      modelVersion: "v2.4.1",
      inferenceTimestamp: new Date(),
    });

    // Seed Case (The Hero Case)
    const p = calculatePriority("Severe", "Hospital", "High", 28.8, true, 0.55);
    await db.insert(cases).values({
      id: "C-1048",
      incidentId: "inc-chennai-demo",
      detectionId: "det-1",
      assetId: "ast-hosp-1",
      status: "NEEDS_REVIEW",
      priorityScore: p.score,
      priorityBreakdown: p.breakdown,
      reviewState: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Demo incident loaded" });
  } catch (error: any) {
    res.status(500).json({ error: { message: error.message } });
  }
});

router.post("/reset", requireAuth, async (req, res) => {
  res.redirect(307, "/api/demo/load");
});

export default router;


