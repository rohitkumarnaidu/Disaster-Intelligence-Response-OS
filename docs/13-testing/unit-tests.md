---
id: unit-tests
title: Unit Testing
sidebar_position: 2
---

# Unit Testing with Vitest

<span className="badge-implemented">Implemented</span>

Unit tests validate mathematical models and deterministic formulas:

```typescript
// artifacts/api-server/src/lib/priority.test.ts
import { expect, test } from "vitest";
import { calculatePriority } from "./priority";

test("calculatePriority yields canonical output 83", () => {
  const result = calculatePriority("Severe", "Hospital", "High", 28.8, true, 0.55);
  expect(result.score).toBe(83);
});
```

Run unit tests:
```bash
pnpm run test
```
