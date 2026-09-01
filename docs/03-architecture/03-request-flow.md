---
id: request-flow
title: Backend Request Lifecycle & Transaction Flow
sidebar_label: Request Flow
sidebar_position: 3
---

# Backend Request Lifecycle & Transaction Flow

<span className="badge-implemented">Implemented</span>

Every mutation request traversing the DRAXELYRA backend follows a strictly ordered, auditable lifecycle ensuring authentication, role verification, input schema validation, transactional state transition, outbox persistence, and real-time broadcast.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Web / PWA Client
    participant Express as Express Gateway
    participant Session as Session & Auth Middleware
    participant Route as Case Route Handler
    participant FSM as Case State Machine
    participant DB as PostgreSQL Transaction (ACID)
    participant Outbox as Transactional Outbox
    participant WS as WebSocket Gateway (/ws)

    Client->>Express: POST /api/cases/:id/review (Cookie: connect.sid)
    Express->>Session: requireAuth & requireRole("Duty Officer", "Incident Commander")
    Session-->>Express: Session Valid (userId="usr_123", role="Duty Officer")

    Express->>Route: Execute Route Controller
    Route->>FSM: transitionCase(caseId, "CONFIRMED", userId, expectedVersion=2, notes)
    
    rect rgb(240, 248, 255)
        note over FSM,DB: PostgreSQL ACID Transaction Boundary
        FSM->>DB: SELECT * FROM cases WHERE id = :id FOR UPDATE
        DB-->>FSM: Case Record (status="DETECTED", version=2)
        FSM->>FSM: Validate FSM Transition (DETECTED -> CONFIRMED)
        FSM->>FSM: Validate Version (expectedVersion === record.version)
        
        FSM->>DB: UPDATE cases SET status="CONFIRMED", version=3 WHERE id=:id AND version=2
        FSM->>DB: INSERT INTO case_status_history (id, case_id, from_status, to_status, user, reason)
        FSM->>DB: INSERT INTO audit_events (id, actor_id, entity_type, entity_id, action, metadata)
        FSM->>DB: INSERT INTO outbox_events (id, event_type, entity_id, version, payload)
        DB-->>FSM: Transaction Committed Successfully
    end

    FSM-->>Route: Updated Case Object (version=3)
    Route-->>Client: HTTP 200 OK { id, status: "CONFIRMED", version: 3 }

    par Non-blocking Async Dispatch
        FSM->>Outbox: dispatchCommittedEvent(event)
        Outbox->>WS: broadcastEvent(DomainEvent: CASE_CONFIRMED)
        WS-->>Client: WebSocket Message { type: "EVENT", event: "CASE_CONFIRMED", version: 3 }
    end
```

---

## Detailed Step-by-Step Lifecycle

1. **Transport Ingress & Cookie Parsing**: The client transmits an HTTP mutation with the signed `connect.sid` cookie.
2. **Authentication Verification**: `requireAuth` extracts the session ID, queries PostgreSQL `session` table, and deserializes user context.
3. **RBAC Authorization**: `requireRole` confirms the user's role matches permitted roles. If unauthorized, returns HTTP 403 `FORBIDDEN`.
4. **Input Schema Validation**: Route controllers validate request bodies against Zod schemas.
5. **ACID Transaction Execution**:
   - Acquires the current record from `cases`.
   - Checks that the transition from `currentStatus` to `newStatus` is valid according to `VALID_CASE_TRANSITIONS`.
   - Checks that `record.version === expectedVersion`.
   - Executes atomic SQL update with version increment.
   - Inserts audit logs into `case_status_history` and `audit_events`.
   - Inserts the domain event into `outbox_events`.
6. **HTTP Response**: The updated record is returned to the client.
7. **Asynchronous Outbox Dispatch**: The outbox worker pushes the event over WebSockets and SSE to all subscribed clients, triggering TanStack Query cache invalidations across the active incident theater.
