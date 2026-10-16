import path from 'node:path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { testDatabaseUrl } from '../vitest.integration.config'

async function ensureDatabase(url: string) {
  const target = new URL(url)
  const name = target.pathname.slice(1)
  const admin = new URL(url)
  admin.pathname = '/postgres'
  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    )
    if (!rowCount) await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`)
  } finally {
    await client.end()
  }
}

export default async function setup() {
  await ensureDatabase(testDatabaseUrl)
  const pool = new pg.Pool({ connectionString: testDatabaseUrl })
  try {
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: path.resolve(import.meta.dirname, '../drizzle'),
    })
  } finally {
    await pool.end()
  }
}
