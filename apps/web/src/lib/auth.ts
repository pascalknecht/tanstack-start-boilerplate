import { betterAuth } from 'better-auth'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.')
}

if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET must be set in production.')
}

const globalForAuth = globalThis as typeof globalThis & {
  __betterAuthPgPool?: Pool
}

// Reuse the pool across dev-server hot reloads to avoid exhausting connections.
const pool =
  globalForAuth.__betterAuthPgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') {
  globalForAuth.__betterAuthPgPool = pool
}

export const auth = betterAuth({
  appName: 'Notilearn',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    tanstackStartCookies(),
  ],
})
