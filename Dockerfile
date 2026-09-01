# Multi-stage Dockerfile for complete DRAXELYRA Monorepo
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy root workspace configurations and TypeScript manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/draxelyra/package.json ./artifacts/draxelyra/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY scripts/package.json ./scripts/

# Install all monorepo dependencies
RUN pnpm install --frozen-lockfile

# Copy all source trees and configurations
COPY . .

# Build all packages (types, DB schema, Vite UI, API server)
RUN pnpm run build

# Runner stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
