# Multi-stage build for the Next.js app.
#
# Debian slim rather than Alpine on purpose: sharp (the watermarking) ships
# prebuilt binaries for glibc, and the Alpine path needs extra packages and
# still trips over musl often enough not to be worth it.

# ---- deps ------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
# postinstall runs `prisma generate`, which needs the schema copied above
RUN npm ci

# ---- build -----------------------------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# a real URL is only needed at runtime; the build just must not fail on it
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

# `output: standalone` emits a minimal server plus only the traced modules;
# public/ and .next/static are not included and must be copied in
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# uploads are written at runtime; docker-compose mounts a volume here so they
# survive a redeploy
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads
VOLUME ["/app/uploads"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/branding || exit 1

CMD ["node", "server.js"]
