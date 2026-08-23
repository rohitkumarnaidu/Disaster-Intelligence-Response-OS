# Domain Services

<span className="badge-implemented">Implemented</span>

Business logic is isolated from route handlers into dedicated domain services. This ensures reusability and simplifies testing.

## Case State Machine

**Source:** `services/case-state-machine.ts`

Cases progress through a strict lifecycle. Invalid transitions throw errors.

**Allowed Transitions:**
- `DETECTED` → [`NEEDS_REVIEW`]
- `NEEDS_REVIEW` → [`CONFIRMED`, `REJECTED`, `UNCERTAIN`]
- `CONFIRMED` → [`PRIORITIZED`, `TASKED`]
- `PRIORITIZED` → [`TASKED`]
- `TASKED` → [`IN_PROGRESS`]
- `IN_PROGRESS` → [`FIELD_VERIFIED`, `ACTIONED`]
- `FIELD_VERIFIED` → [`ACTIONED`]
- `ACTIONED` → [`CLOSED`]
- `UNCERTAIN` → [`CLOSED`]
- `REJECTED` → [`CLOSED`]
- `CLOSED` → []

**Implementation details (`transitionCase` function):**
- Executes entirely within a `db.transaction()`.
- Checks `expectedVersion`. Throws `VERSION_CONFLICT` if the database version is higher (Optimistic Concurrency Control).
- Validates the transition graph.
- Updates the case, incrementing the version by 1.
- Inserts a record into `caseStatusHistory`.
- Emits records to `auditEvents`.

## Task State Machine

**Source:** `services/task-state-machine.ts`

Tasks track physical or analytical work.

**Allowed Transitions:**
- `UNASSIGNED` → [`ASSIGNED`]
- `ASSIGNED` → [`IN_PROGRESS`, `UNASSIGNED`]
- `IN_PROGRESS` → [`BLOCKED`, `COMPLETED`, `VERIFIED`]
- `BLOCKED` → [`IN_PROGRESS`, `UNASSIGNED`]
- `COMPLETED` → [`VERIFIED`, `CLOSED`]
- `VERIFIED` → [`CLOSED`]
- `CLOSED` → []

Uses the identical OCC pattern as cases. Automatically populates `completedAt` timestamps upon entering terminal states.

## Priority Engine

**Source:** `lib/priority.ts`

Calculates the operational priority of a case (0-100 scale).

**Formula:**
`round(0.30 * S + 0.25 * C + 0.20 * E + 0.15 * U + 0.10 * (confidence * 100))`

- **S (Severity)**: destroyed=100, severe=75, moderate=45, uncertain=35, minor=20, no damage=0.
- **C (Criticality)**: hospital/emergency=100, bridge=85, gov/utility=75, school=70, residential=40, commercial=30, default=15.
- **E (Exposure)**: high=90, medium=55, low=20.
- **U (Urgency)**: `min(100, max(0, 100 - (hours/72)*100) + (accessConstrained ? 20 : 0))`
- **Confidence**: AI detection confidence score (0.0 to 1.0).

## Evidence Upload Pipeline

**Source:** `routes/evidence.ts`

Handles secure file uploads from the field.
- **Storage**: Uses Multer with memory storage.
- **Limits**: 50MB maximum file size.
- **MIME Whitelist**: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`.
- **Validation**: Performs magic byte checking on the buffer (JPEG=FFD8FF, PNG=89504E47, WebP=RIFF+WEBP, MP4=ftyp) to prevent spoofed extensions.
- **Integrity**: Calculates a SHA-256 hash of the buffer.
- **Security**: Prevents path traversal by validating that the resolved path strictly `startsWith(uploadsDir)`.
- **Persistence**: Writes buffer to disk and inserts an `evidence` record in the database.\n