import { AIProvider, StructuredReportOutput } from "../AIProvider";
import { aiProviderFactory } from "../AIProviderFactory";
import { db, incidents, cases, tasks, criticalAssets, detections, outcomes } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

export class ReportingAssistant {
  private provider: AIProvider;

  constructor(providerId?: string) {
    this.provider = aiProviderFactory.getProvider(providerId);
  }

  public async generateIncidentReport(
    incidentId: string,
    options: { providerId?: string } = {}
  ): Promise<StructuredReportOutput> {
    const provider = options.providerId
      ? aiProviderFactory.getProvider(options.providerId)
      : this.provider;

    const [incident] = await db.select().from(incidents).where(eq(incidents.id, incidentId));
    if (!incident) throw new Error(`Incident ${incidentId} not found`);

    const allCases = await db
      .select()
      .from(cases)
      .leftJoin(criticalAssets, eq(cases.assetId, criticalAssets.id))
      .leftJoin(detections, eq(cases.detectionId, detections.id))
      .where(eq(cases.incidentId, incidentId));

    const allTasks = await db.select().from(tasks).where(eq(tasks.caseId, allCases[0]?.cases.id || ""));
    const allOutcomes = await db.select().from(outcomes);

    const verifiedCases = allCases
      .filter((c) => c.cases.reviewState === "CONFIRMED" || c.cases.status === "FIELD_VERIFIED" || c.cases.status === "ACTIONED")
      .map((c) => ({
        id: c.cases.id,
        assetName: c.critical_assets?.name,
        assetType: c.critical_assets?.type,
        severity: c.detections?.severity || "Moderate",
        priorityScore: c.cases.priorityScore,
        reviewState: c.cases.reviewState,
      }));

    logger.info({ incidentId, verifiedCasesCount: verifiedCases.length }, "Generating AI incident situation report");

    return provider.generateReport(incident, verifiedCases);
  }
}

export const reportingAssistant = new ReportingAssistant();
