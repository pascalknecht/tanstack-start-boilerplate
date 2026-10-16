import type { BetterAuthPlugin } from 'better-auth'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Better Auth trusts every allowed host pattern (*.APP_ROOT_DOMAIN) as an
// origin, and SameSite cookies do not separate subdomains of one site. Without
// this, a page on one tenant could post to another tenant's auth endpoints.
export function sameOriginGuard() {
  return {
    id: 'tenant-same-origin-guard',
    onRequest: async (request) => {
      if (SAFE_METHODS.has(request.method)) return
      const origin = request.headers.get('origin')
      if (!origin) return
      const host = request.headers.get('host') ?? new URL(request.url).host
      if (originHost(origin) === host.toLowerCase()) return
      return {
        response: Response.json(
          { code: 'INVALID_ORIGIN', message: 'Cross-origin request rejected' },
          { status: 403 },
        ),
      }
    },
  } satisfies BetterAuthPlugin
}

function originHost(origin: string) {
  try {
    return new URL(origin).host.toLowerCase()
  } catch {
    return null
  }
}
