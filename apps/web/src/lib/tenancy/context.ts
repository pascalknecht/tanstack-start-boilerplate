import { AsyncLocalStorage } from 'node:async_hooks'
import type { Site, TenantInfo } from './site'

const globalForTenancy = globalThis as typeof globalThis & {
  __notilearnSiteStorage?: AsyncLocalStorage<Site>
}

// A single instance must be shared by the request middleware and the auth
// adapter, even when Vite reloads one of those modules in development.
const storage = (globalForTenancy.__notilearnSiteStorage ??=
  new AsyncLocalStorage<Site>())

export class TenantContextError extends Error {
  constructor(message = 'No tenant in the current request context.') {
    super(message)
    this.name = 'TenantContextError'
  }
}

export function runWithSite<T>(site: Site, fn: () => T): T {
  return storage.run(site, fn)
}

export function runWithTenant<T>(tenant: TenantInfo, fn: () => T): T {
  return storage.run({ kind: 'tenant', tenant }, fn)
}

export function getCurrentSite(): Site | undefined {
  return storage.getStore()
}

export function getCurrentTenant(): TenantInfo | null {
  const site = storage.getStore()
  return site?.kind === 'tenant' ? site.tenant : null
}

export function requireTenant(): TenantInfo {
  const tenant = getCurrentTenant()
  if (!tenant) throw new TenantContextError()
  return tenant
}
