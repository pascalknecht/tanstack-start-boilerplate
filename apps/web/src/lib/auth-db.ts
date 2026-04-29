import { prismaReady } from './prisma'

const globalForAuthDb = globalThis as typeof globalThis & {
  __authDbReadyPromise?: Promise<void>
}

export const authDbReady = globalForAuthDb.__authDbReadyPromise ?? prismaReady

if (!globalForAuthDb.__authDbReadyPromise) {
  globalForAuthDb.__authDbReadyPromise = authDbReady
}
