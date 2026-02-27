# syntax=docker/dockerfile:1

# ================================
# TwitterOS Frontend Dockerfile
# ================================

FROM node:20-alpine AS base
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ================================
# Dependencies stage
# ================================
FROM base AS deps
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ================================
# Build stage
# ================================
FROM base AS builder
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build argument for API URL
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN pnpm build

# ================================
# Production stage
# ================================
FROM base AS production
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG NEXT_PUBLIC_API_URL
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]