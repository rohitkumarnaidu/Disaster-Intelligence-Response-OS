# End-to-End Scenario Testing

<span className="badge-implemented">Implemented</span>

The automated test script `test-e2e.js` validates the entire operational lifecycle:
1. **RBAC Guard Test**: Verifies an Analyst cannot `POST /api/incidents` (HTTP 403).
2. **OCC Conflict Test**: Simulates concurrent triage by Clients A and B to verify HTTP 409 rejection on stale version.
3. **Audit Verification**: Asserts audit event records exist for all case mutations.

Execute the suite:
```bash
node test-e2e.js
```
