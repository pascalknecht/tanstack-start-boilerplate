# Notilearn

Notilearn is a multi-tenant e-learning platform that imports courses from Notion. Every academy (tenant) lives on its own subdomain (`acme.notilearn.com`) or custom domain, with its own learners and accounts.

The app is a **TanStack Start** + **React 19** monorepo (Turborepo, pnpm) backed by PostgreSQL, Drizzle ORM and Better Auth.

## Tech Stack

| Category        | Technology                                                                       |
| --------------- | -------------------------------------------------------------------------------- |
| Framework       | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev/)    |
| Routing         | [TanStack Router](https://tanstack.com/router) (file-based routing)              |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                    |
| Build Tool      | [Vite 8](https://vite.dev/)                                                      |
| Build System    | [Turborepo](https://turbo.build/repo)                                            |
| Package Manager | [pnpm](https://pnpm.io/)                                                         |
| Database        | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-kit` migrations) |
| Auth            | [Better Auth](https://www.better-auth.com/) (tenant-scoped Drizzle adapter)      |
| Hosting         | [Vercel](https://vercel.com/) (Nitro `vercel` preset) or Docker                  |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                                      |
| Testing         | [Vitest](https://vitest.dev/) + Testing Library                                  |

## Project Structure

```text
├── apps/
│   └── web/                  # TanStack Start application
│       ├── public/
│       ├── drizzle/          # Generated SQL migrations
│       ├── scripts/          # Dev scripts (seed)
│       ├── src/
│       │   ├── components/   # Marketing, tenant and shadcn/ui components
│       │   ├── db/           # Drizzle schema and client
│       │   ├── lib/tenancy/  # Host resolution, tenant context, scoped auth adapter
│       │   ├── routes/       # File-based routes
│       │   ├── router.tsx    # Router creation and registration
│       │   ├── start.ts      # Global request middleware (tenant resolution)
│       │   └── styles.css    # Global Tailwind + theme styles
│       ├── test/             # Integration test setup
│       ├── drizzle.config.ts
│       ├── vercel.ts         # Vercel project config (@vercel/config)
│       ├── vite.config.ts    # Vite + TanStack Start + Nitro config
│       └── tsconfig.json
├── docs/                     # Spike write-ups
├── docker/
│   └── pgadmin/              # pgAdmin server pre-configuration
├── Dockerfile                # Production image
├── Dockerfile.dev            # Development image
├── docker-compose.dev.yml    # PostgreSQL + pgAdmin (development tooling)
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 26 (see `.nvmrc`)
- [pnpm](https://pnpm.io/) 10.6+

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL instance (the default matches `docker-compose.dev.yml`) and replace `BETTER_AUTH_SECRET` with a random value (`openssl rand -base64 32`). Keep `APP_ROOT_DOMAIN=localhost` for local development.

### 3. Start PostgreSQL and run migrations

```bash
docker compose -f docker-compose.dev.yml up -d postgres
pnpm db:migrate
pnpm db:seed
```

`pnpm db:migrate` applies the SQL migrations in `apps/web/drizzle` with drizzle-kit. `pnpm db:seed` creates two demo tenants, `acme` and `beta`.

The schema lives in `apps/web/src/db/schema.ts`. After changing it, generate a migration and commit it:

```bash
pnpm db:generate --name describe_the_change
pnpm db:migrate
```

### 4. Start development

```bash
pnpm dev
```

- [http://localhost:3000](http://localhost:3000): marketing site (root domain)
- [http://acme.localhost:3000](http://acme.localhost:3000) and [http://beta.localhost:3000](http://beta.localhost:3000): tenant academies, each with its own accounts (register, login, dashboard)
- any other subdomain: 404

Browsers resolve `*.localhost` to `127.0.0.1`, so no hosts-file changes are needed.

## Multi-tenancy

Every request goes through a request middleware (`src/start.ts`) that resolves the Host header (`src/lib/tenancy/resolve-host.ts`) and looks up the tenant. The tenant is available in route context (`context.site`) and through `AsyncLocalStorage` (`getCurrentTenant()` / `requireTenant()` / `runWithTenant()` in `src/lib/tenancy/context.ts`) for code outside routes.

Better Auth's tables are tenant-scoped: the adapter wrapper adds `tenant_id` to every query and throws when no tenant is in context. Sessions are host-only cookies. See [docs/spike-auth.md](docs/spike-auth.md) for the design, its limits and the isolation tests.

## Available Scripts

Run these from the monorepo root:

| Command                 | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `pnpm dev`              | Start app(s) in development mode                         |
| `pnpm build`            | Build app(s) for production                              |
| `pnpm start`            | Run the built production server (`.output`)              |
| `pnpm lint`             | Run lint checks (TypeScript no-emit)                     |
| `pnpm typecheck`        | Run TypeScript checks                                    |
| `pnpm test`             | Run unit tests with Vitest                               |
| `pnpm test:integration` | Run Postgres-backed integration tests (tenant isolation) |
| `pnpm db:generate`      | Generate a SQL migration from the Drizzle schema         |
| `pnpm db:migrate`       | Apply pending migrations (drizzle-kit)                   |
| `pnpm db:seed`          | Create the `acme` and `beta` demo tenants                |
| `pnpm db:studio`        | Open Drizzle Studio                                      |
| `pnpm format`           | Format code with Prettier                                |
| `pnpm format:check`     | Check code formatting                                    |

For app-scoped commands, run from `apps/web`:

| Command                 | Description                           |
| ----------------------- | ------------------------------------- |
| `pnpm dev`              | Start TanStack Start on port 3000     |
| `pnpm build`            | Build TanStack Start output           |
| `pnpm start`            | Run the built Nitro server            |
| `pnpm lint`             | TypeScript no-emit lint pass          |
| `pnpm typecheck`        | Full TypeScript check                 |
| `pnpm test`             | Run route/component tests with Vitest |
| `pnpm test:integration` | Run Postgres-backed integration tests |

## Testing

- `pnpm test` runs the unit tests (`src/**/*.test.ts(x)`). It needs no services.
- `pnpm test:integration` runs `src/**/*.integration.test.ts` against a real PostgreSQL. It creates and migrates a `notilearn_test` database on the server from `TEST_DATABASE_URL` (default `postgres://postgres:postgres@localhost:5432/notilearn_test`), so start the docker-compose Postgres first:

```bash
docker compose -f docker-compose.dev.yml up -d postgres
pnpm test:integration
```

## Routing

Routes are defined as files in `apps/web/src/routes`. TanStack Router generates a route tree automatically and keeps route typing in sync.

## Docker

Development docker-compose provides database tooling:

- PostgreSQL
- pgAdmin

Start:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Recreate:

```bash
docker compose -f docker-compose.dev.yml down --remove-orphans
docker compose -f docker-compose.dev.yml up -d --force-recreate
```

| Service    | Default host port | Description                |
| ---------- | ----------------- | -------------------------- |
| `postgres` | `localhost:5432`  | PostgreSQL 17 database     |
| `pgadmin`  | `localhost:5050`  | pgAdmin web UI (notilearn) |

## Production

`pnpm build` uses [Nitro](https://nitro.build/) to produce a self-contained Node server in `apps/web/.output` (all server dependencies bundled). Run it with `pnpm start` or `node apps/web/.output/server/index.mjs`.

### Vercel

`apps/web/vercel.ts` configures the project with [`@vercel/config`](https://www.npmjs.com/package/@vercel/config). On Vercel (`VERCEL=1`), Nitro builds with its `vercel` preset and emits `.vercel/output`.

1. Import the repository and set the Root Directory to `apps/web`.
2. Add the apex domain and a wildcard domain (`notilearn.com`, `*.notilearn.com`). Wildcards require Vercel nameservers.
3. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://notilearn.com` and `APP_ROOT_DOMAIN=notilearn.com`.
4. Run `pnpm db:migrate` against the production database before promoting a release.

Preview deployments on `*.vercel.app` are not tenant hosts and currently return 404 (see `docs/spikes.md`).

### Docker image

```bash
# App image (~185 MB, no node_modules, runs as non-root, has a HEALTHCHECK)
docker build -t my-app .

docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://notilearn.com \
  -e APP_ROOT_DOMAIN=notilearn.com \
  my-app
```

### Required environment variables

| Variable             | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string. Append `?sslmode=require` for managed databases. |
| `BETTER_AUTH_SECRET` | Random secret of 32+ characters. Requests fail if it is missing in production. |
| `BETTER_AUTH_URL`    | Public URL of the root site. Its protocol and port apply to tenant hosts.      |
| `APP_ROOT_DOMAIN`    | Apex domain; `<slug>.APP_ROOT_DOMAIN` serves tenants. Defaults to `localhost`. |

See `.env.example` for the variables later phases use (Notion, storage, custom domains, email).

### Checklist

- Run `pnpm db:migrate` with `DATABASE_URL` pointing at the production database before starting a new release.
- Serve the app behind a reverse proxy or load balancer that sets `X-Forwarded-For`. Better Auth rate-limits by client IP; without that header all clients share one rate-limit bucket.
- The container health check calls `/api/health`, which answers on any host. The server shuts down gracefully on `SIGTERM`.
