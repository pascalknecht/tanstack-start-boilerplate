import type { VercelConfig } from '@vercel/config/v1'

// Set the Vercel project's Root Directory to apps/web. Nitro switches to its
// `vercel` preset automatically when VERCEL is set (see vite.config.ts).
const config: VercelConfig = {
  framework: 'tanstack-start',
  installCommand: 'pnpm install --frozen-lockfile',
  buildCommand: 'pnpm build',
}

export default config
