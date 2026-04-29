import { authDbReady } from '../src/lib/auth-db'
import { closePrismaDb } from '../src/lib/prisma'

await authDbReady

console.log('Better Auth schema synced to pglite.')
await closePrismaDb()
