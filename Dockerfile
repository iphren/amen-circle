# syntax=docker/dockerfile:1

# Debian (not Alpine) so Prisma's default debian-openssl-3.0.x query engine
# works without binaryTargets changes; slim images ship without openssl,
# which Prisma needs for TLS and engine detection.
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
# Build-only placeholders: collecting page data imports route modules, and
# session.ts fails fast without SESSION_SECRET. Every route is dynamic (only
# /icon.svg is prerendered), so nothing derived from these lands in the build
# output; the runner stage never sees them and real values arrive at runtime
# via .env.production.
RUN SESSION_SECRET=build-placeholder-must-be-32-chars-long \
    ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# There is intentionally no `COPY public` — this repo has no public/ directory.
# Ops scripts (encrypt backfill, recovery links) run via `docker compose exec`;
# their @prisma/client dependency is already in standalone/node_modules because
# serverExternalPackages copies it whole during output file tracing.
COPY --from=builder --chown=node:node /app/scripts ./scripts
USER node
EXPOSE 3000
CMD ["node", "server.js"]
