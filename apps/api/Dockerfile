# ═══════════════════════════════════════════════════════════════════════════════
# Multi-stage Dockerfile for the NestJS API
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Install ALL dependencies (including devDeps needed for build)
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/validation/package.json ./packages/validation/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
# Compile TypeScript → JavaScript
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy full source
COPY . .

# Generate Prisma Client
RUN pnpm --filter @collab/api db:generate

# Build the API
RUN pnpm --filter @collab/api build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
# Minimal production image — no devDependencies, no source files
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

# Copy only what's needed to run
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist           ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json   ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma         ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules            ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json            ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/pnpm-workspace.yaml     ./pnpm-workspace.yaml

USER nestjs

WORKDIR /app/apps/api

EXPOSE 3001

# Run Prisma migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
