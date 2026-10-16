# Spikes

## Spike 1: tenant-scoped Better Auth

Done, and it works. See [spike-auth.md](./spike-auth.md).

## Spike 2: Workflow SDK with TanStack Start / Nitro (not started)

Out of scope for Phase 0. Notes from the docs, not verified in this repo yet:

- Workflow SDK (`workflow`, v5.2 at the time of writing) supports TanStack Start officially ([changelog, June 2026](https://vercel.com/changelog/workflow-sdk-now-supports-tanstack-start)). Add `workflow()` from `workflow/vite` as the **first** Vite plugin, before `tanstackStart()` and `nitro()`. It wraps the `workflow/nitro` module, so it relies on the Nitro Vite plugin that this app already uses.
- Workflows are plain functions with `"use workflow"` and `"use step"` directives, started from a server route with `start()` from `workflow/api`.
- `@workflow/nitro` declares no Nitro peer range, so compatibility with our Nitro `3.0.x-beta` has to be tested. Pin both versions together when adopting it.
- On Vercel it needs no extra configuration (queues and persistence are managed). Self-hosted or Docker deployments need a "world" backend (e.g. Postgres) configured. That matters because the Docker image is still supported.
- Workflow steps run outside a request, so there is no tenant in AsyncLocalStorage. Pass `tenantId` explicitly as a workflow argument and wrap step bodies in `runWithTenant()` (`src/lib/tenancy/context.ts`) before touching tenant-scoped code. The auth adapter throws otherwise, which is the desired failure mode.

## Deployment on Vercel

- `apps/web/vercel.ts` (`@vercel/config`) sets the framework, install and build commands. Set the project's Root Directory to `apps/web`.
- `vite.config.ts` selects the Nitro `vercel` preset when `VERCEL` is set, which emits `.vercel/output`, a single streaming Node function. Other builds keep `node-server` for Docker. `NITRO_PRESET` overrides both.
- Nitro currently targets the `nodejs24.x` runtime on Vercel, while `package.json` declares `engines.node >= 26`. Check that Vercel accepts the project's Node setting, or relax `engines`, before the first deploy.
- Production needs a wildcard domain (`*.notilearn.com`, which requires Vercel nameservers) plus `APP_ROOT_DOMAIN=notilearn.com` and `BETTER_AUTH_URL=https://notilearn.com`.
