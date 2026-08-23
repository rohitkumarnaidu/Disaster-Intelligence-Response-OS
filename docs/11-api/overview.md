# API Reference Overview
<span className="badge-implemented">Implemented</span>

The DRAXELYRA backend provides a strictly-typed RESTful API designed for reliability and audibility in high-stress operational environments.

## Core Principles

- **Predictable Error Handling:** All errors return a standard JSON envelope with an explicit HTTP status code.
- **Strict Validation:** Incoming payloads are validated using `Zod` schemas shared between the client and server via the `@workspace/api-zod` package.
- **Stateless/Stateful Hybrid:** Authentication relies on stateful HTTP-only cookies, but endpoints are structurally stateless.

## Standard Error Codes

The system relies on a unified subset of HTTP status codes:

| Code | Status | Meaning |
|---|---|---|
| **400** | `BAD_REQUEST` | Payload failed Zod validation or was malformed. |
| **401** | `UNAUTHORIZED` | Missing or invalid session cookie. |
| **403** | `FORBIDDEN` | Authenticated, but lacks required Role-Based Access Control (RBAC) permissions. |
| **404** | `NOT_FOUND` | The requested resource does not exist. |
| **409** | `VERSION_CONFLICT` | Optimistic concurrency check failed (ETag/Version mismatch). |
| **422** | `INVALID_TRANSITION` | Attempted to move a case or task to an illogical state machine phase. |
| **500** | `SERVER_ERROR` | Unhandled backend exception. |

## Request Validation

**Source File:** `backend/src/middleware/validate.ts`

```typescript
export const validateBody = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res.status(400).json({ error: 'BAD_REQUEST', details: error.errors });
    }
  };
```
