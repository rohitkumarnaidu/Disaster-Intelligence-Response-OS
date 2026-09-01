---
id: schemas-validation
title: Zod Validation Schemas for AI Outputs
sidebar_label: Schemas & Validation
sidebar_position: 5
---

# Zod Validation Schemas for AI Outputs

<span className="badge-implemented">Implemented</span>

**Source File**: [`artifacts/api-server/src/ai/schemas.ts`](file:///c:/Users/Dell/Downloads/DRAXELYRA-Response-OS/DRAXELYRA-Response-OS/artifacts/api-server/src/ai/schemas.ts)

```typescript
import { z } from 'zod';

export const DamageAssessmentOutputSchema = z.object({
  severity: z.enum(['DESTROYED', 'SEVERE', 'MODERATE', 'MINOR', 'NO_DAMAGE', 'UNCERTAIN']),
  confidenceScore: z.number().min(0.0).max(1.0),
  observedChanges: z.array(z.string()),
  infrastructureImpact: z.object({
    facilityOperational: z.boolean(),
    accessRoadsPassable: z.boolean(),
    floodDepthEstimatedCm: z.number().nullable(),
  }),
  reasoningNotes: z.string().min(10),
  uncertaintyFactors: z.array(z.string()),
});

export type DamageAssessmentOutput = z.infer<typeof DamageAssessmentOutputSchema>;
```
