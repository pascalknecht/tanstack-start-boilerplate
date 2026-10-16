import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure it.')
}

const globalForDb = globalThis as typeof globalThis & {
  __notilearnPgPool?: Pool
}

// Reuse the pool across dev-server hot reloads to avoid exhausting connections.
export const pool =
  globalForDb.__notilearnPgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__notilearnPgPool = pool
}

export const db = drizzle({ client: pool, schema })

export type Database = typeof db
