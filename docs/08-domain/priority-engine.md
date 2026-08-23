# Priority Engine

<span className="badge-implemented">Implemented</span>

## Scoring Formula
The Priority Engine (`lib/priority.ts`) calculates a dynamic score based on multiple factors:
`Score = round(0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * (confidence * 100))`

### Factors
- **S (Severity)**: destroyed=100, severe=75, moderate=45, uncertain=35, minor=20, no_damage=0
- **C (Criticality)**: hospital/emergency=100, bridge=85, gov/utility=75, school=70, residential=40, commercial=30, default=15
- **E (Exposure)**: high=90, medium=55, low=20
- **U (Urgency)**: `min(100, max(0, 100 - (hours/72)*100) + (accessConstrained ? 20 : 0))`

## Return Value
The engine returns an object containing the final score and a detailed breakdown:
```typescript
{
  score: number,
  breakdown: Array<{ label: string, value: number }>
}
```

## Canonical Test
Input: Severe severity, Hospital criticality, High exposure, 28.8h since event, access constrained, 0.55 confidence.
Output: Final score `83`.
