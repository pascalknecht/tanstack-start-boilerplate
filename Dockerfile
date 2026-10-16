# syntax=docker/dockerfile:1

# ── Stage 1: base ─────────────────────────────────────
FROM node:26-alpine AS base
RUN npm install -g pnpm@10.6.2
WORKDIR /app

# ── Stage 2: install dependencies ─────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 3: build ────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV DOCKER=1
RUN pnpm build

# ── Stage 4: production runner ────────────────────────
# Nitro bundles all server dependencies into .output, so the runtime image
# needs neither node_modules nor pnpm.
FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=node:node /app/apps/web/.output ./.output

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/auth/ok').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
