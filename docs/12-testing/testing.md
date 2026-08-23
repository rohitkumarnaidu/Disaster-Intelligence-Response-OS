# Testing Infrastructure
<span className="badge-implemented">Implemented</span>

The DRAXELYRA platform enforces quality and reliability through rigorous unit testing (Vitest) and end-to-end testing.

## Unit Testing

The priority scoring algorithm is critical to life-safety operations. It is heavily tested using Vitest to ensure deterministic outputs.

**Source File:** `backend/tests/priority.test.ts`

```typescript
import { calculatePriority } from '../src/utils/priority';
import { describe, it, expect } from 'vitest';

describe('Priority Algorithm', () => {
  it('calculates canonical High Priority asset accurately', () => {
    const score = calculatePriority({
      damageClass: 'Severe',
      assetType: 'Hospital',
      populationDensity: 'High',
      hoursSinceIncident: 28.8,
      criticalInfrastructure: true,
      aiConfidence: 0.55
    });
    
    // Despite 55% AI confidence, severity + hospital + infra heavily boosts score
    expect(score).toBe(83);
  });
});
```

## End-to-End Testing

The E2E suite verifies the complete happy-path of the application, from analyst login through field task verification.

**Source File:** `tests/test-e2e.js`

### Core Workflow Validated:
1. **Authentication:** Logs in using standard analyst credentials.
2. **Environment Reset:** Hits `/api/demo/load` to guarantee a clean, known state.
3. **Data Verification:** Fetches "Hero" Case `C-1048` and asserts the calculated priority is precisely `83`.
4. **Analyst Review:** Submits a `CONFIRMED` review decision via `POST /api/cases/C-1048/review`.
5. **Audit Trail Verification:** Validates that the review transition successfully appended immutable records to the audit log.
