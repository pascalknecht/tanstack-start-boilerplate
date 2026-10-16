import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '#/db'
import { account, session, user, verification } from '#/db/schema'
import { sendAuthEmail } from '#/lib/auth-email'
import { getAppRootDomain, getAppUrl } from '#/lib/env'
import { getCurrentTenant, requireTenant } from '#/lib/tenancy/context'
import { sameOriginGuard } from '#/lib/tenancy/same-origin-guard'
import { withTenantScope } from '#/lib/tenancy/tenant-scoped-adapter'

if (process.env.NODE_ENV === 'production' && !process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET must be set in production.')
}

const appUrl = getAppUrl()
const rootDomain = getAppRootDomain()
const protocol = appUrl.protocol === 'http:' ? 'http' : 'https'

// The Host header carries the port in development (acme.localhost:3000).
const allowedHosts = [rootDomain, `*.${rootDomain}`].flatMap((host) =>
  appUrl.port ? [host, `${host}:${appUrl.port}`] : [host],
)

const tenantField = {
  type: 'string',
  // Stamped by the tenant-scoped adapter, never accepted from input.
  required: false,
  input: false,
  returned: false,
} as const

export const auth = betterAuth({
  appName: 'Notilearn',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts,
    fallback: appUrl.origin,
    protocol,
  },
  trustedOrigins: async () => {
    // TODO(custom domains): add the request origin when it is a verified tenant domain.
    return allowedHosts.map((host) => `${protocol}://${host}`)
  },
  database: withTenantScope(
    drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    { getTenantId: () => getCurrentTenant()?.id },
  ),
  user: {
    additionalFields: {
      tenantId: tenantField,
      role: {
        type: ['owner', 'admin', 'learner'],
        required: false,
        input: false,
        defaultValue: 'learner',
      },
    },
  },
  session: {
    additionalFields: { tenantId: tenantField },
    // The cookie cache would validate sessions from a signed cookie without
    // reading the (tenant-scoped) session table.
    cookieCache: { enabled: false },
  },
  account: {
    additionalFields: { tenantId: tenantField },
  },
  verification: {
    additionalFields: { tenantId: tenantField },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendAuthEmail({
        kind: 'reset-password',
        to: user.email,
        url,
        token,
        tenantId: requireTenant().id,
      })
    },
  },
  // Email verification and change-email use stateless JWTs that only carry the
  // email address, so they are not bound to a tenant. See docs/spike-auth.md.
  disabledPaths: ['/send-verification-email', '/verify-email', '/change-email'],
  advanced: {
    crossSubDomainCookies: { enabled: false },
  },
  plugins: [sameOriginGuard(), tanstackStartCookies()],
})

export type Auth = typeof auth
