# Notilearn

Notilearn is a multi-tenant e-learning platform that imports courses from Notion. Every academy (tenant) lives on its own subdomain (`acme.notilearn.com`) or custom domain, with its own learners and accounts.

The app is a **TanStack Start** + **React 19** monorepo (Turborepo, pnpm) backed by PostgreSQL, Drizzle ORM and Better Auth.

## Tech Stack

| Category        | Technology                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| Framework       | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev/) |
| Routing         | [TanStack Router](https://tanstack.com/router) (file-based routing)            |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                  |
| Build Tool      | [Vite 8](https://vite.dev/)                                                     |
| Build System    | [Turborepo](https://turbo.build/repo)                                           |
| Package Manager | [pnpm](https://pnpm.io/)                                                        |
| Auth            | [Better Auth](https://www.better-auth.com/) (PostgreSQL via `pg`)               |
| Styling         | [Tailwind CSS v4](https://tailwindcss.com/)                                     |
| Testing         | [Vitest](https://vitest.dev/) + Testing Library                                 |

## Project Structure

```text
├── apps/
│   └── web/                  # TanStack Start application
│       ├── public/
│       ├── src/
│       │   ├── components/   # Starter UI components
│       │   ├── routes/       # File-based routes
│       │   ├── router.tsx    # Router creation and registration
│       │   └── styles.css    # Global Tailwind + theme styles
│       ├── vite.config.ts    # Vite + TanStack Start plugin config
│       └── tsconfig.json
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

Set `DATABASE_URL` to your PostgreSQL instance (the default matches `docker-compose.dev.yml`) and replace `BETTER_AUTH_SECRET` with a random value (`pnpm --filter @repo/web exec auth secret`).

### 3. Start PostgreSQL and run migrations

```bash
docker compose -f docker-compose.dev.yml up -d postgres
pnpm db:migrate
```

`pnpm db:migrate` creates or updates the Better Auth tables (`user`, `session`, `account`, `verification`). Re-run it whenever you add Better Auth plugins that need schema changes.

### 4. Start development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

Run these from the monorepo root:

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Start app(s) in development mode                |
| `pnpm build`        | Build app(s) for production                     |
| `pnpm start`        | Run the built production server (`.output`)     |
| `pnpm lint`         | Run lint checks (TypeScript no-emit)            |
| `pnpm typecheck`    | Run TypeScript checks                           |
| `pnpm test`         | Run tests with Vitest                           |
| `pnpm db:migrate`   | Apply Better Auth schema to PostgreSQL          |
| `pnpm format`       | Format code with Prettier                       |
| `pnpm format:check` | Check code formatting                           |

For app-scoped commands, run from `apps/web`:

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `pnpm dev`      | Start TanStack Start on port 3000         |
| `pnpm build`    | Build TanStack Start output               |
| `pnpm start`    | Run the built Nitro server                |
| `pnpm lint`     | TypeScript no-emit lint pass              |
| `pnpm typecheck`| Full TypeScript check                     |
| `pnpm test`     | Run route/component tests with Vitest     |

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

| Service    | Default host port | Description            |
| ---------- | ----------------- | ---------------------- |
| `postgres` | `localhost:5432`  | PostgreSQL 17 database         |
| `pgadmin`  | `localhost:5050`  | pgAdmin web UI (notilearn) |

## Production

`pnpm build` uses [Nitro](https://nitro.build/) to produce a self-contained Node server in `apps/web/.output` (all server dependencies bundled). Run it with `pnpm start` or `node apps/web/.output/server/index.mjs`.

### Docker image

```bash
# App image (~185 MB, no node_modules, runs as non-root, has a HEALTHCHECK)
docker build -t my-app .

docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e BETTER_AUTH_SECRET=... \
  -e BETTER_AUTH_URL=https://your-domain.com \
  my-app
```

### Required environment variables

| Variable             | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string. Append `?sslmode=require` for managed databases. |
| `BETTER_AUTH_SECRET` | Random secret of 32+ characters. Requests fail if it is missing in production. |
| `BETTER_AUTH_URL`    | Public URL of the app. Requests from other origins are rejected.           |

### Checklist

- Run `pnpm db:migrate` with `DATABASE_URL` pointing at the production database before starting a new release.
- Serve the app behind a reverse proxy or load balancer that sets `X-Forwarded-For`. Better Auth rate-limits by client IP; without that header all clients share one rate-limit bucket.
- The container health check calls `/api/auth/ok`. The server shuts down gracefully on `SIGTERM`.
