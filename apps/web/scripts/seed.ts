import { randomUUID } from 'node:crypto'
import pg from 'pg'

const tenants = [
  { slug: 'acme', name: 'Acme Academy' },
  { slug: 'beta', name: 'Beta School' },
]

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

try {
  for (const { slug, name } of tenants) {
    await pool.query(
      'INSERT INTO tenant (id, slug, name) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
      [randomUUID(), slug, name],
    )
    console.log(`tenant ${slug}: http://${slug}.localhost:3000`)
  }
} finally {
  await pool.end()
}
