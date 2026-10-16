import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The monorepo keeps a single .env at the repository root.
const envDir = fileURLToPath(new URL('../..', import.meta.url))

const config = defineConfig(({ mode }) => {
  // Expose server-only variables (DATABASE_URL, BETTER_AUTH_SECRET, ...) to
  // process.env without overriding values already set by the environment.
  process.env = { ...loadEnv(mode, envDir, ''), ...process.env }

  // Vercel builds emit the Build Output API; everything else (Docker, `pnpm
  // start`) gets a standalone Node server. NITRO_PRESET overrides both.
  const preset =
    process.env.NITRO_PRESET ?? (process.env.VERCEL ? 'vercel' : 'node-server')

  return {
    envDir,
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackStart(),
      nitro({ preset }),
      viteReact(),
    ],
  }
})

export default config
