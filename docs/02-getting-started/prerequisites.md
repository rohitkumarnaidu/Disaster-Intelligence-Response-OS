# Prerequisites

<span className="badge-implemented">Implemented</span>

Before developing or deploying DRAXELYRA, ensure your local or server environment satisfies the following requirements.

---

## 1. System Requirements

- **Operating System**: Linux (Ubuntu 22.04+ recommended), macOS (13+), or Windows 11 with WSL2 / PowerShell 7.
- **RAM**: Minimum 8 GB (16 GB recommended for running full PostgreSQL and multiple Vite dev servers).
- **Disk Space**: Minimum 10 GB free space for Node.js modules, PostgreSQL volumes, and evidence uploads.

---

## 2. Core Tooling & Runtimes

| Tool | Required Version | Purpose | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v24.x` or `v20.x LTS` | JavaScript runtime | `node -v` |
| **pnpm** | `v10.x` or `v11.x` | Monorepo package manager | `pnpm -v` |
| **PostgreSQL** | `v15.x` or `v16.x` | Relational database | `psql --version` |
| **Docker & Compose** | `v24+` / `v2.20+` | Optional containerized database | `docker compose version` |
| **Git** | `2.40+` | Version control | `git --version` |

---

## 3. Package Manager Configuration (`pnpm`)

The DRAXELYRA monorepo uses **pnpm workspaces** with strict supply-chain security rules. Ensure `pnpm` is installed globally:

```bash
# Install pnpm using Corepack (recommended with Node.js)
corepack enable
corepack prepare pnpm@latest --activate

# Or install via npm
npm install -g pnpm
```

:::note Supply Chain Security
The repository enforces `minimumReleaseAge: 1440` (24 hours) in `pnpm-workspace.yaml` to protect against npm supply-chain attacks. All packages must meet this release age unless explicitly whitelisted.
:::
