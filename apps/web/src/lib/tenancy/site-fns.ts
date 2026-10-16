import { createServerFn } from '@tanstack/react-start'
import { getCurrentSite } from './context'
import type { Site } from './site'

export const getSite = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Site> => getCurrentSite() ?? { kind: 'not-found' },
)

let clientSite: Promise<Site> | undefined

// The host never changes during a page's lifetime, so the browser only needs
// to ask once. The server resolves it per request.
export function loadSite(): Promise<Site> {
  if (typeof document === 'undefined') return getSite()
  clientSite ??= getSite().catch((error: unknown) => {
    clientSite = undefined
    throw error
  })
  return clientSite
}

export function rememberSite(site: Site) {
  if (typeof document !== 'undefined') clientSite ??= Promise.resolve(site)
}
