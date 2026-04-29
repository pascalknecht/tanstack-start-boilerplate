import { authDbReady } from '../src/lib/auth-db'

await authDbReady

console.log('Better Auth schema synced to pglite.')
