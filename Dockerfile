# ── Stage 1: base ─────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate

# ── Stage 2: install dependencies ─────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/nextjs/package.json ./apps/nextjs/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 3: build ────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/nextjs/node_modules ./apps/nextjs/node_modules
COPY . .

ENV DOCKER=1
RUN pnpm build

# ── Stage 4: production runner ────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/apps/nextjs/.output ./apps/nextjs/.output
COPY --from=builder --chown=appuser:nodejs /app/apps/nextjs/public ./apps/nextjs/public
COPY --from=builder --chown=appuser:nodejs /app/apps/nextjs/package.json ./apps/nextjs/package.json

USER appuser

EXPOSE 3000

CMD ["node", "apps/nextjs/.output/server/index.mjs"]
