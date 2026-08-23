# Environment Variables Reference

<span className="badge-implemented">Implemented</span>

DRAXELYRA services read configuration from environment variables defined in `.env` files or container environments.

---

## Core Configuration Reference

| Variable | Description | Required | Default Value | Example |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URI | **Yes** | — | `postgres://postgres:postgres@localhost:5433/draxelyra` |
| `PORT` | HTTP port for the Express API server | No | `5000` | `5000` |
| `SESSION_SECRET` | Secret key used to sign Express session cookies | **Yes (Prod)** | `draxelyra_default_secret` | `c89f3a1e9b724f8d...a4e7` |
| `NODE_ENV` | Runtime environment mode | No | `development` | `production` / `development` |
| `VITE_API_URL` | Custom API base URL for frontend client | No | `/api` (relative) | `http://localhost:5000/api` |

---

## Sample `.env` File

Create a `.env` file in the project root:

```ini
# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/draxelyra

# API Server Port
PORT=5000

# Session Cookie Encryption Secret
SESSION_SECRET=e7b4c921389e4726af829103c847e920d3f2810a9c

# Node Runtime Mode
NODE_ENV=development
```
