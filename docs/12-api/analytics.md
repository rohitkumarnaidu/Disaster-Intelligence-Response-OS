# Analytics API Reference

### `GET /api/analytics/overview`
Returns aggregated operational metrics and funnel statistics:
```json
{
  "casesTotal": 18,
  "needsReview": 4,
  "confirmed": 10,
  "rejected": 2,
  "uncertain": 2,
  "falsePositiveRate": 14,
  "averageTimeToAssess": 24,
  "averageTimeToVerify": 45,
  "averageTimeToTask": 18,
  "slaCompliance": 92,
  "funnel": { "detected": 18, "verified": 10, "actioned": 8, "closed": 6 }
}
```
