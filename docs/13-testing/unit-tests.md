# Unit Testing with Vitest

<span className="badge-implemented">Implemented</span>

Unit tests run via `pnpm test`.

### Canonical Priority Formula Test (`priority.test.ts`)

```typescript
describe('Priority Engine', () => {
  it('calculates canonical Hero Case C-1048 priority as 83', () => {
    const score = calculatePriority('Severe', 'Hospital', 'High', 28.8, true, 0.55);
    expect(score).toBe(83);
  });
});
```
