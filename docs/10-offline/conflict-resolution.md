# Conflict Resolution & Version Checking

<span className="badge-implemented">Implemented</span>

When offline mutations are replayed against the API server:
1. Every mutation carries the entity's `version` at the time of offline editing.
2. The server compares the mutation version against the live PostgreSQL version.
3. If concurrent online edits occurred, the server returns `409 Conflict` with `VERSION_CONFLICT`, preserving data integrity and prompting the user for resolution.
