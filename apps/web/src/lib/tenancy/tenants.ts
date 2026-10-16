import { eq } from 'drizzle-orm'
import { db } from '#/db'
import { tenant } from '#/db/schema'
import type { HostResolution } from './resolve-host'
import type { Site, TenantInfo } from './site'

export async function findTenantBySlug(slug: string): Promise<TenantInfo | null> {
  const [row] = await db
    .select({ id: tenant.id, slug: tenant.slug, name: tenant.name })
    .from(tenant)
    .where(eq(tenant.slug, slug))
    .limit(1)
  return row ?? null
}

export async function lookupSite(resolution: HostResolution): Promise<Site> {
  switch (resolution.kind) {
    case 'root':
      return { kind: 'root' }
    case 'tenant': {
      const found = await findTenantBySlug(resolution.slug)
      return found ? { kind: 'tenant', tenant: found } : { kind: 'not-found' }
    }
    case 'custom':
      // TODO(phase: custom domains): look up verified hostnames in the `domain` table.
      return { kind: 'not-found' }
    case 'invalid':
      return { kind: 'not-found' }
  }
}
