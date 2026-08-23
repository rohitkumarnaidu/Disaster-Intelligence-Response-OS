# Backend Architecture

<span className="badge-implemented">Implemented</span>

The backend service at `artifacts/api-server` is an **Express 5** application in TypeScript compiled with **esbuild**.

---

## 1. Application Bootstrap (`index.ts` & `app.ts`)

- **`index.ts`**: Resolves the HTTP port (`process.env.PORT || 5000`) and initiates the Express listener with graceful shutdown handling.
- **`app.ts`**: Configures the HTTP pipeline:

```typescript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from '@workspace/db';
import router from './routes';

const app = express();
const PgSession = connectPgSimple(session);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'draxelyra_default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use('/api', router);
export default app;
```

---

## 2. Middleware Stack Order

1. **Pino Logger**: Assigns unique request IDs and logs structured JSON logs.
2. **CORS**: Validates incoming origin and permits session cookie headers.
3. **Body Parser**: Decodes JSON and URL-encoded payloads.
4. **Session**: Deserializes PostgreSQL session ID and binds `req.session.userId`.
5. **requireAuth**: Blocks unauthenticated requests with `401 Unauthorized`.
6. **requireRole(...roles)**: Enforces role permissions with `403 Forbidden`.
