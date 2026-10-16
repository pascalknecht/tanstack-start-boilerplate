import { notFound } from '@tanstack/react-router'
import type { Site, TenantInfo } from './site'

export function assertTenantSite(site: Site): TenantInfo {
  if (site.kind !== 'tenant') throw notFound()
  return site.tenant
}

export function assertRootSite(site: Site) {
  if (site.kind !== 'root') throw notFound()
}
