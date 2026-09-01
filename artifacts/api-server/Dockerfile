# Multi-stage Dockerfile for @workspace/api-server
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/

RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY lib/db ./lib/db
COPY lib/api-zod ./lib/api-zod
COPY artifacts/api-server ./artifacts/api-server

RUN pnpm -F @workspace/db run build || true
RUN pnpm -F @workspace/api-zod run build || true
RUN pnpm -F @workspace/api-server run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 3000
CMD ["node", "artifacts/api-server/dist/index.mjs"]
