# Installation Guide

<span className="badge-implemented">Implemented</span>

Follow these steps to clone the repository, install dependencies across the monorepo, and prepare the workspace.

---

## 1. Clone the Repository

```bash
git clone https://github.com/rohitkumarnaidu/Disaster-Intelligence-Response-OS.git
cd Disaster-Intelligence-Response-OS
```

---

## 2. Install Dependencies

Install all packages across the root workspace, `lib/*`, and `artifacts/*`:

```bash
pnpm install
```

This installs:
- Monorepo developer tooling (`typescript`, `vitest`, `eslint`, `tsx`, `docusaurus`)
- Backend dependencies (`express`, `drizzle-orm`, `bcryptjs`, `connect-pg-simple`, `multer`, `pino`)
- Frontend packages (`react`, `vite`, `tailwindcss`, `maplibre-gl`, `@tanstack/react-query`, `wouter`)

---

## 3. Verify TypeScript Builds

Build the shared libraries (`lib/api-zod`, `lib/api-client-react`, `lib/db`):

```bash
pnpm run typecheck:libs
```

Run full typecheck across all applications:

```bash
pnpm run typecheck
```
