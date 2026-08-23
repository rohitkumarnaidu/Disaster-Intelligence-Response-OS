---
id: relationships
title: Relationships & Foreign Keys
sidebar_position: 3
---

# Relationships & Foreign Keys

<span className="badge-implemented">Implemented</span>

Drizzle relations link parent and child entities for declarative joins:

```typescript
export const casesRelations = relations(cases, ({ one, many }) => ({
  incident: one(incidents, { fields: [cases.incidentId], references: [incidents.id] }),
  detection: one(detections, { fields: [cases.detectionId], references: [detections.id] }),
  asset: one(criticalAssets, { fields: [cases.assetId], references: [criticalAssets.id] }),
  tasks: many(tasks),
  evidence: many(evidence),
  history: many(caseStatusHistory),
}));
```
