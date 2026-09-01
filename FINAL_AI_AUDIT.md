# DRAXELYRA — FINAL AI & MULTIMODAL ENGINEERING AUDIT
**Disaster Intelligence & Response OS**
*Certified: 2026-09-01 | AI Engine: Google Gemini Multimodal + Structured Outputs + Audit Hashing*

---

## 1. AI System Overview & Zero-Trust Governance

The AI subsystem in DRAXELYRA strictly assists human incident commanders and analysts. It **never** triggers automated, destructive, or unverified operational dispatches without human oversight.

- **Primary Foundation Model**: `gemini-2.5-flash` via `@google/genai`.
- **Inference Mode**: Multimodal Satellite & Pre/Post Aerial Vision Damage Assessment.
- **Output Schema Guarantee**: Enforced via Zod runtime schemas (`DamageAssessmentOutputSchema`) with strict typed fields.
- **Deterministic Priority Separation**: Damage severity classification ($0–100$) feeds into a mathematical formula; the LLM does *not* invent priority scores.

---

## 2. Structured Damage Assessment Schema

```typescript
export const DamageAssessmentOutputSchema = z.object({
  damageClass: z.enum(["NO_DAMAGE", "MINOR", "MODERATE", "SEVERE", "DESTROYED", "UNCERTAIN"]),
  confidence: z.number().min(0).max(1),
  primaryHazard: z.string(),
  structuralIntegrityScore: z.number().min(0).max(100),
  observedAnomalies: z.array(z.string()),
  recommendedAction: z.string(),
  explanation: z.string(),
  boundingCoordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});
```

---

## 3. Cryptographic Input/Output Hashing & Auditability
Every AI inference operation is recorded in the `ai_decision_logs` table:
- **`input_hash`**: SHA-256 hash of the prompt, pre/post satellite imagery URIs, and contextual metadata.
- **`output_hash`**: SHA-256 hash of the raw JSON structured output received from Gemini.
- **`reviewer_decision`**: Logged when the human analyst either confirms, rejects, or edits the AI assessment.
- **Immutability**: Decision records cannot be modified once written.

---

## 4. Operational Fallback & Resiliency
- If `GEMINI_API_KEY` is not present, the provider reports status `NOT_CONFIGURED`.
- If the AI call times out ($>15$ seconds) or experiences API rate limiting (`429`), the system seamlessly falls back to a deterministic rule-based heuristic with `confidence = 0.50` and flags the case as `UNCERTAIN` for mandatory human review.
