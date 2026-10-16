# Spike 1: tenant-scoped Better Auth

**Result: the adapter-wrapper approach works.** One Better Auth instance serves every tenant. Accounts, passwords, sessions and password-reset tokens are isolated per tenant, and integration tests against Postgres prove it. The schema-per-tenant fallback is not needed.

## How it works

```
request ─▶ siteMiddleware ─▶ resolveHost(host, APP_ROOT_DOMAIN)
                │                └─ tenant slug ─▶ SELECT tenant WHERE slug = …
                ▼
        AsyncLocalStorage.run({ kind: 'tenant', tenant }, next)
                │
                ▼
   /api/auth/* ─▶ auth.handler ─▶ withTenantScope(drizzleAdapter) ─▶ Postgres
                                   ├─ create: stamps tenantId
                                   ├─ find/count/update/delete/consume/increment:
                                   │    appends AND tenant_id = <current>
                                   └─ no tenant in context ─▶ TenantContextError
```

- `src/lib/tenancy/resolve-host.ts`: a pure function that classifies the Host header as `root`, `tenant`, `custom` or `invalid`. It handles ports, `www.`, reserved slugs, `*.localhost` and IP addresses.
- `src/lib/tenancy/middleware.ts`: the global request middleware (registered in `src/start.ts`). It looks up the tenant and runs the rest of the request inside an `AsyncLocalStorage` scope (`src/lib/tenancy/context.ts`). It also passes the site as request context. Unknown hosts render the 404 page, and API or server-function calls on unknown hosts get a bare 404.
- `src/lib/tenancy/tenant-scoped-adapter.ts`: wraps the adapter returned by `drizzleAdapter()`, after Better Auth's adapter factory. The wrapper therefore sees logical field names (`tenantId`) and works with any adapter. It also:
  - wraps the adapter that Better Auth passes to `transaction()` callbacks. Without that, the callback would get the raw, unscoped adapter.
  - **fails closed** for models that are neither tenant-scoped (`user`, `session`, `account`, `verification`) nor declared global (`rateLimit`). A plugin that adds a table therefore can't silently bypass tenant isolation.
  - strips or rejects writes that try to change `tenantId`.
- `tenantId` is declared as a Better Auth `additionalField` on all four models with `input: false, returned: false`. The adapter factory only passes declared fields through to Drizzle. It is `required: false` at the Better Auth level because sign-up validation runs before the adapter stamps it. Postgres enforces `NOT NULL`.

### Defense in depth in the schema

- `UNIQUE (tenant_id, email)` on `user` instead of a global unique email.
- `session`, `account` and `handoff_token` reference `user (tenant_id, id)` through a composite foreign key, so Postgres rejects a row that points at another tenant's user. One integration test covers this.
- `account` is unique on `(tenant_id, provider_id, account_id)`, so the same Google account can join several academies.

### Base URL, origins, cookies

- **Dynamic base URL**: Better Auth 1.7 supports `baseURL: { allowedHosts, fallback, protocol }` natively and resolves the base URL per request. We do **not** need one auth instance per host. `allowedHosts` is `[APP_ROOT_DOMAIN, *.APP_ROOT_DOMAIN]`, plus `:port` variants when `BETTER_AUTH_URL` has a port, because the Host header includes it in development.
- **Trusted origins**: `trustedOrigins` is a function returning the root and wildcard tenant origins. Custom domains will be added there once the `domain` table exists.
- **Same-origin guard**: Better Auth automatically trusts every `allowedHosts` pattern as an origin, and `SameSite` cookies don't separate subdomains of the same site. A page on `evil.notilearn.com` could otherwise POST to `acme.notilearn.com/api/auth/*` with the victim's cookies. The `sameOriginGuard` plugin (`src/lib/tenancy/same-origin-guard.ts`) rejects non-GET auth requests whose `Origin` is not the request's own host.
- **Cookies** are host-only: no `crossSubDomainCookies`, and no `Domain=` attribute (asserted in tests). Moving a user from the root domain to a tenant host will use `handoff_token` (table created, flow is Phase 1).

## What the adapter cannot protect, and how it is handled

The wrapper only covers database access. Anything Better Auth validates **statelessly with the instance secret** is shared by all tenants:

| Mechanism                                    | Risk                                                                                                                                                                                                                                                                 | Status                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Email verification and change-email tokens   | Stateless JWTs that only carry `{ email, updateTo }`. A change-email token minted on tenant A (where an attacker can sign up as `victim@x.com`) can be replayed on `/verify-email` of tenant B. It changes the email of B's `victim@x.com` and **signs in as them**. | `/send-verification-email`, `/verify-email` and `/change-email` are in `disabledPaths`, with a test. |
| Session cookie cache (`session.cookieCache`) | Sessions would be validated from a signed cookie without reading the tenant-scoped table, so a user could replay their own cookie on another tenant.                                                                                                                 | Explicitly disabled.                                                                                 |
| Signed session cookie                        | The signature is valid on every tenant, but the token lookup is tenant-scoped, so it is rejected (tested).                                                                                                                                                           | OK                                                                                                   |
| Password reset, OAuth state, OTPs            | Stored in `verification`, so they are scoped (reset tested).                                                                                                                                                                                                         | OK                                                                                                   |

**Before enabling email verification** (needed for Phase 1 sign-up), pick one:

1. **Recommended:** use a DB-backed flow, e.g. Better Auth's `emailOTP` plugin (stored in `verification`, scoped automatically) or a magic link built on `verification`.
2. Derive a per-tenant secret (`HMAC(BETTER_AUTH_SECRET, tenant.id)`). This needs one Better Auth instance per tenant (an LRU cache keyed by tenant id). It also isolates the cookie signatures. It is a bigger change, so I didn't do it in Phase 0.

Plugins that issue stateless tokens (`jwt`, `bearer`, `one-time-token` with cookie storage, `multiSession`) need the same review before they are enabled. Any new table they add will throw until it is added to `scopedModels` or `globalModels`.

## Running the isolation tests

```bash
docker compose -f docker-compose.dev.yml up -d postgres   # or any Postgres 14+
pnpm test:integration
```

The suite creates and migrates `notilearn_test` on the same server (override with `TEST_DATABASE_URL`). It then inserts two throwaway tenants and drives `auth.handler` with real `Request` objects, so origin checks and cookies are exercised too. It covers:

- the same email signs up on tenant A and tenant B, giving two users, two credential accounts and different password hashes.
- A's password fails on B, and a user that only exists on A can't sign in on B.
- A's session cookie or token resolves to `null` on B, both through HTTP and `auth.api.getSession`. Sign-out and revoke on B leave A's session alive, and `list-sessions` only shows the current tenant's sessions.
- a reset token issued on A is `INVALID_TOKEN` on B and works on A. B's password stays unchanged. Requesting a reset on B for an A-only email sends nothing.
- email verification endpoints return 404, cross-tenant `Origin` returns 403, and cookies have no `Domain`.
- auth calls without a tenant in context throw `TenantContextError`.
- Postgres rejects a session pointing at another tenant's user.

Breaking the wrapper so that it stamps but doesn't filter makes 7 of these tests fail.

## Follow-ups

- Custom domains: resolve `custom` hosts through a `domain` table (verified only), add them to `trustedOrigins` and, because `allowedHosts` is static, use either `allowedHosts: ['*']` (the middleware already validates hosts) or per-host instances.
- Vercel preview deployments (`*.vercel.app`) resolve as custom domains and return 404 until preview hosts get a mapping, for example a `PREVIEW_TENANT` env var.
- Handoff from the root domain to a tenant host: create a single-use `handoff_token` (hashed) on the root domain, consume it on the tenant host, and set a host-only session there.
