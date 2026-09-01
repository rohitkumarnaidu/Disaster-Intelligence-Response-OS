import { AIProvider, AssessmentInput, StructuredEvidenceSummary } from "../AIProvider";
import { aiProviderFactory } from "../AIProviderFactory";
import { db, evidence, cases } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

export class EvidenceAssistant {
  private provider: AIProvider;

  constructor(providerId?: string) {
    this.provider = aiProviderFactory.getProvider(providerId);
  }

  public async summarizeCaseEvidence(
    caseId: string,
    options: { providerId?: string } = {}
  ): Promise<StructuredEvidenceSummary> {
    const provider = options.providerId
      ? aiProviderFactory.getProvider(options.providerId)
      : this.provider;

    const [c] = await db.select().from(cases).where(eq(cases.id, caseId));
    if (!c) throw new Error(`Case ${caseId} not found`);

    const evidenceList = await db
      .select()
      .from(evidence)
      .where(eq(evidence.caseId, caseId));

    const input: AssessmentInput = {
      incidentId: c.incidentId,
      caseId: c.id,
      metadata: {
        evidenceCount: evidenceList.length,
        evidenceTypes: evidenceList.map((e) => e.type),
        evidenceUris: evidenceList.map((e) => e.uri),
      },
    };

    logger.info({ caseId, provider: provider.id }, "Summarizing case evidence");
    return provider.summarizeEvidence(input);
  }
}

export const evidenceAssistant = new EvidenceAssistant();
