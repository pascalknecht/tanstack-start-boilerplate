import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

type MemoryDB = Record<string, any[]>

const globalForAuth = globalThis as typeof globalThis & {
  __betterAuthMemoryDb?: MemoryDB
}

const memoryDb = globalForAuth.__betterAuthMemoryDb ?? {}

if (!globalForAuth.__betterAuthMemoryDb) {
  globalForAuth.__betterAuthMemoryDb = memoryDb
}

export const auth = betterAuth({
  appName: 'TanStack Start Boilerplate',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: memoryAdapter(memoryDb),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    tanstackStartCookies(),
  ],
})
