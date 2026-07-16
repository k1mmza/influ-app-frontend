# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js 15 (SSR) frontend using standalone output.
#
# IMPORTANT: NEXT_PUBLIC_API_URL is baked into the client JS bundle at BUILD time.
# It must be passed as a --build-arg (see below), not as a runtime `docker run -e`,
# because NEXT_PUBLIC_* vars are inlined during `npm run build`.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://influ-app-backend.onrender.com \
#     -t influ-app-frontend .

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies against the lockfile first (better layer caching).
COPY package*.json ./
RUN npm ci

# Copy the rest of the source and build.
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Standalone server.js reads PORT/HOSTNAME; bind to all interfaces so the
# published Docker port is reachable (default is localhost inside the container).
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the built-in non-root user shipped in the node image.
USER node

# Standalone output: minimal server + traced node_modules, plus static assets.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
