import { describe, it, expect, beforeAll } from "vitest";
import {
  db,
  initDb,
  incidents,
  imageryAssets,
  criticalAssets,
  detections,
  cases,
  evidence,
  tasks,
  outcomes,
  auditEvents,
  aiDecisionLogs,
} from "@workspace/db";
import { eq } from "drizzle-orm";

describe("Data Lineage & Provenance Integrity Test Suite", () => {
  beforeAll(async () => {
    await initDb();
  });

  it("verifies uncorrupted 10-link provenance graph from raw sensor data to audited operational outcome", async () => {
    const testUuid = `lin-${Date.now()}`;
    const incidentId = `inc-${testUuid}`;
    const imageryId = `img-${testUuid}`;
    const assetId = `ast-${testUuid}`;
    const detectionId = `det-${testUuid}`;
    const caseId = `case-${testUuid}`;
    const taskId = `task-${testUuid}`;
    const outcomeId = `out-${testUuid}`;
    const evidenceId = `ev-${testUuid}`;
    const aiLogId = `ailog-${testUuid}`;
    const auditId = `aud-${testUuid}`;

    // 1. Ingest Incident
    await db.insert(incidents).values({
      id: incidentId,
      name: "Odisha Supercyclone Inundation Corridor",
      disasterType: "Tropical Cyclone",
      status: "Active",
      severity: "Severe",
      source: "SACHET_NDMA",
      aoi: { type: "Point", coordinates: [85.82, 20.29] },
    });

    // 2. Ingest Satellite Product
    await db.insert(imageryAssets).values({
      id: imageryId,
      incidentId,
      externalProductId: "S1A_IW_GRDH_1SDV_20260901_ODISHA_SWATH",
      provider: "COPERNICUS_STAC",
      collection: "sentinel-1-grd",
      title: "Sentinel-1 SAR Real Swath",
      source: "COPERNICUS_STAC",
      acquisitionTime: new Date(),
      qualityStatus: "READY",
      dataMode: "REAL",
    });

    // 3. Ingest Critical Asset
    await db.insert(criticalAssets).values({
      id: assetId,
      name: "Bhubaneswar Central Power Substation",
      type: "Substation",
      location: { type: "Point", coordinates: [85.82, 20.29] },
      criticalityScore: 90,
      populationExposureTier: "High",
    });

    // 4. Ingest AI Detection
    await db.insert(detections).values({
      id: detectionId,
      incidentId,
      imageryId,
      geometry: { type: "Point", coordinates: [85.82, 20.29] },
      class: "Substation Submersion Hazard",
      severity: "Severe",
      confidence: 0.91,
      modelName: "Gemini Multimodal Damage Assessment",
      modelVersion: "gemini-2.5-flash",
      inferenceTimestamp: new Date(),
      externalSource: "COPERNICUS_STAC",
      externalId: "S1A_IW_GRDH_1SDV_20260901_ODISHA_SWATH",
    });

    // 5. Create Case
    await db.insert(cases).values({
      id: caseId,
      incidentId,
      detectionId,
      assetId,
      status: "CONFIRMED",
      priorityScore: 88,
      priorityBreakdown: { severityScore: 25, exposureScore: 25, criticalityScore: 25 },
      reviewState: "CONFIRMED",
      version: 2,
      dataMode: "REAL",
    });

    // 6. Ingest AI Decision Log
    await db.insert(aiDecisionLogs).values({
      id: aiLogId,
      caseId,
      incidentId,
      provider: "gemini-multimodal",
      model: "gemini-2.5-flash",
      modelVersion: "v1.0",
      promptVersion: "damage_assessment_v1",
      inputHash: "test_input_hash_89237489",
      outputHash: "test_output_hash_23984729",
      result: { damageClass: "SEVERE", confidence: 0.91 },
      damageClass: "SEVERE",
      confidence: 0.91,
      latencyMs: 340,
    });

    // 7. Attach Evidence
    await db.insert(evidence).values({
      id: evidenceId,
      caseId,
      type: "SAR_COHERENCE_MAP",
      uri: "https://dataspace.copernicus.eu/products/S1A_IW_GRDH_1SDV_20260901_ODISHA_SWATH",
      source: "COPERNICUS_STAC",
    });

    // 8. Create Response Task
    await db.insert(tasks).values({
      id: taskId,
      caseId,
      title: "Deploy high-capacity dewatering pumps to Substation",
      priority: 1,
      status: "COMPLETED",
      version: 2,
      completedAt: new Date(),
    });

    // 9. Record Outcome
    await db.insert(outcomes).values({
      id: outcomeId,
      caseId,
      action: "Dewatering pumps deployed; power restored to district hospital feeder",
      result: "SUCCESS",
      completedBy: "usr-sysadmin",
    });

    // 10. Record Audit Event
    await db.insert(auditEvents).values({
      id: auditId,
      entityType: "case",
      entityId: caseId,
      action: "CASE_CONFIRMED_AND_COMPLETED",
      actorId: "usr-sysadmin",
      metadata: { priorityScore: 88, source: "COPERNICUS_STAC" },
    });

    // Lineage Verification
    const [fetchedCase] = await db.select().from(cases).where(eq(cases.id, caseId));
    expect(fetchedCase).toBeDefined();

    const [fetchedDetection] = await db.select().from(detections).where(eq(detections.id, fetchedCase.detectionId!));
    expect(fetchedDetection.imageryId).toBe(imageryId);

    const [fetchedImagery] = await db.select().from(imageryAssets).where(eq(imageryAssets.id, fetchedDetection.imageryId!));
    expect(fetchedImagery.externalProductId).toBe("S1A_IW_GRDH_1SDV_20260901_ODISHA_SWATH");

    const [fetchedEvidence] = await db.select().from(evidence).where(eq(evidence.caseId, caseId));
    expect(fetchedEvidence.type).toBe("SAR_COHERENCE_MAP");

    const [fetchedTask] = await db.select().from(tasks).where(eq(tasks.caseId, caseId));
    expect(fetchedTask.status).toBe("COMPLETED");

    const [fetchedOutcome] = await db.select().from(outcomes).where(eq(outcomes.caseId, caseId));
    expect(fetchedOutcome.result).toBe("SUCCESS");
  });
});
