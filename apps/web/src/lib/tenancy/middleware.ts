import { createMiddleware } from '@tanstack/react-start'
import { getAppRootDomain } from '#/lib/env'
import { runWithSite } from './context'
import { resolveHost } from './resolve-host'
import { lookupSite } from './tenants'

const HOST_INDEPENDENT_PATHS = new Set(['/api/health'])

export function getRequestHost(request: Request) {
  return request.headers.get('host') ?? new URL(request.url).host
}

export const siteMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ request, pathname, handlerType, next }) => {
    if (HOST_INDEPENDENT_PATHS.has(pathname)) return next()

    const resolution = resolveHost(getRequestHost(request), getAppRootDomain())
    const site = await lookupSite(resolution)

    // Pages render the not-found shell through the router; everything else
    // gets a bare 404 so no handler runs without a resolved site.
    if (
      site.kind === 'not-found' &&
      (handlerType === 'serverFn' || pathname.startsWith('/api/'))
    ) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    return runWithSite(site, () => next({ context: { site } }))
  },
)
