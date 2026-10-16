export type HostResolution =
  | { kind: 'root' }
  | { kind: 'tenant'; slug: string }
  | { kind: 'custom'; hostname: string }
  | { kind: 'invalid' }

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'about',
  'account',
  'accounts',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'blog',
  'cdn',
  'dashboard',
  'dev',
  'docs',
  'help',
  'login',
  'mail',
  'notilearn',
  'notion',
  'register',
  'signin',
  'signup',
  'smtp',
  'staging',
  'static',
  'status',
  'support',
  'www',
])

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/

export function isValidSlug(slug: string) {
  return LABEL.test(slug) && !slug.startsWith('xn--')
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug)
}

export function normalizeHostname(host: string | null | undefined) {
  if (!host) return null
  let hostname = host.trim().toLowerCase()
  if (hostname.startsWith('[')) return null
  const colon = hostname.indexOf(':')
  if (colon !== -1) {
    const port = hostname.slice(colon + 1)
    if (!/^\d{1,5}$/.test(port)) return null
    hostname = hostname.slice(0, colon)
  }
  if (hostname.endsWith('.')) hostname = hostname.slice(0, -1)
  if (!hostname || hostname.length > 253) return null
  if (!hostname.split('.').every((label) => LABEL.test(label))) return null
  return hostname
}

export function resolveHost(
  host: string | null | undefined,
  rootDomain: string,
): HostResolution {
  const hostname = normalizeHostname(host)
  const root = normalizeHostname(rootDomain)
  if (!hostname || !root) return { kind: 'invalid' }
  if (IPV4.test(hostname)) return { kind: 'invalid' }

  if (hostname === root || hostname === `www.${root}`) return { kind: 'root' }

  if (hostname.endsWith(`.${root}`)) {
    const slug = hostname.slice(0, -(root.length + 1))
    if (slug.includes('.') || !isValidSlug(slug) || isReservedSlug(slug)) {
      return { kind: 'invalid' }
    }
    return { kind: 'tenant', slug }
  }

  if (!hostname.includes('.') || hostname.endsWith('.localhost')) {
    return { kind: 'invalid' }
  }

  return { kind: 'custom', hostname }
}
