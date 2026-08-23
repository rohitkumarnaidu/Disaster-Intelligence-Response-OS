# End-to-End API Verification

<span className="badge-implemented">Implemented</span>

The automated E2E script (`node test-e2e.js`) validates:
1. System Admin login & session cookie establishment.
2. Loading deterministic Chennai flood demo replay.
3. Fetching case `C-1048` and verifying initial priority score (`83`).
4. Submitting analyst confirmation review with version checking.
5. Verifying audit event persistence in `audit_events`.
