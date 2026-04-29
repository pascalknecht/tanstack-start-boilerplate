# TanStack Start Boilerplate

A production-ready monorepo starter built around **TanStack Start**, **TanStack Router**, **React 19**, **Tailwind CSS v4**, and **Turborepo**.

## Tech Stack

| Category        | Technology                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| Framework       | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev/) |
| Routing         | [TanStack Router](https://tanstack.com/router) (file-based routing)            |
| Language        | [TypeScript](https://www.typescriptlang.org/)                                  |
| Build Tool      | [Vite 8](https://vite.dev/)                                                     |
| Build System    | [Turborepo](https://turbo.build/repo)                                           |
| Package Manager | [pnpm](https://pnpm.io/)                                                        |
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
│       ├── prisma/           # Prisma schema for local pglite database
│       ├── vite.config.ts    # Vite + TanStack Start plugin config
│       └── tsconfig.json
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20.19.0
- [pnpm](https://pnpm.io/) 10.6+

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

The starter works without mandatory secrets by default.

### 3. Start development

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
| `pnpm start`        | Start the production preview server             |
| `pnpm lint`         | Run lint checks (TypeScript no-emit)            |
| `pnpm typecheck`    | Run TypeScript checks                           |
| `pnpm test`         | Run tests with Vitest                           |
| `pnpm format`       | Format code with Prettier                       |
| `pnpm format:check` | Check code formatting                           |

For app-scoped commands, run from `apps/web`:

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `pnpm dev`      | Start TanStack Start on port 3000         |
| `pnpm build`    | Build TanStack Start output               |
| `pnpm start`    | Serve built output with Vite preview      |
| `pnpm lint`     | TypeScript no-emit lint pass              |
| `pnpm typecheck`| Full TypeScript check                     |
| `pnpm test`     | Run route/component tests with Vitest     |

## Routing

Routes are defined as files in `apps/web/src/routes`. TanStack Router generates a route tree automatically and keeps route typing in sync.

## Database (Prisma + pglite)

This starter uses Prisma with a local file-backed [pglite](https://pglite.dev/) database, so Docker is not required.

Initialize and sync the local auth schema:

```bash
pnpm --filter @repo/web sync:auth-schema
```

By default the database files are stored at `apps/web/.pglite`. Override with `DATABASE_DIR` in `.env`.
