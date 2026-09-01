# Multi-stage Dockerfile for @workspace/draxelyra
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY artifacts/draxelyra/package.json ./artifacts/draxelyra/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/

RUN pnpm install --frozen-lockfile

COPY lib/ ./lib/
COPY artifacts/draxelyra/ ./artifacts/draxelyra/

RUN pnpm -F @workspace/draxelyra run build

FROM nginx:alpine AS runner
COPY --from=builder /app/artifacts/draxelyra/dist/public /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
