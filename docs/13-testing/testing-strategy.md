# Testing Strategy

<span className="badge-implemented">Implemented</span>

DRAXELYRA enforces a multi-tier testing pyramid:

1. **Unit Tests (Vitest)**: Mathematical validation of priority score calculations and individual state machine transitions.
2. **OCC Concurrency Tests**: Race-condition simulations testing concurrent updates to verify `409 VERSION_CONFLICT` behavior.
3. **End-to-End API Integration Tests (`test-e2e.js`)**: Automated HTTP sequence testing complete triage workflows.
