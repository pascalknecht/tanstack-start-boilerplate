import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db, pool } from '#/db'
import { account, session, tenant, user, verification } from '#/db/schema'
import { auth } from '#/lib/auth'
import { setAuthEmailHandler } from '#/lib/auth-email'
import type { AuthEmail } from '#/lib/auth-email'
import { runWithTenant, TenantContextError } from './context'
import type { TenantInfo } from './site'

const run = randomUUID().slice(0, 8)
let tenantA: TenantInfo
let tenantB: TenantInfo
let outbox: AuthEmail[] = []

function hostOf(t: TenantInfo) {
  return `${t.slug}.localhost:3000`
}

async function call(
  t: TenantInfo,
  path: string,
  init: { method?: string; body?: unknown; cookie?: string; origin?: string } = {},
) {
  const headers = new Headers({
    host: hostOf(t),
    origin: init.origin ?? `http://${hostOf(t)}`,
  })
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  if (init.cookie) headers.set('cookie', init.cookie)
  const request = new Request(`http://${hostOf(t)}/api/auth${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const response = await runWithTenant(t, () => auth.handler(request))
  const text = await response.text()
  const isJson = response.headers.get('content-type')?.includes('json')
  return {
    status: response.status,
    json: isJson && text ? JSON.parse(text) : null,
    cookie: sessionCookie(response),
  }
}

function sessionCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
}

function signUp(t: TenantInfo, email: string, password: string, name = 'Learner') {
  return call(t, '/sign-up/email', { body: { email, password, name } })
}

function signIn(t: TenantInfo, email: string, password: string) {
  return call(t, '/sign-in/email', { body: { email, password } })
}

function getSession(t: TenantInfo, cookie: string | undefined) {
  return call(t, '/get-session', { cookie })
}

function uniqueEmail(label: string) {
  return `${label}-${randomUUID().slice(0, 8)}@example.com`
}

beforeAll(async () => {
  const rows = await db
    .insert(tenant)
    .values([
      { slug: `it-a-${run}`, name: 'Tenant A' },
      { slug: `it-b-${run}`, name: 'Tenant B' },
    ])
    .returning({ id: tenant.id, slug: tenant.slug, name: tenant.name })
  ;[tenantA, tenantB] = rows
  setAuthEmailHandler((email) => {
    outbox.push(email)
  })
})

beforeEach(() => {
  outbox = []
})

afterAll(async () => {
  setAuthEmailHandler(null)
  await db.delete(tenant).where(inArray(tenant.id, [tenantA.id, tenantB.id]))
  await pool.end()
})

describe('tenant-scoped Better Auth', () => {
  it('creates independent accounts for the same email on two tenants', async () => {
    const email = uniqueEmail('same')
    const a = await signUp(tenantA, email, 'password-for-a', 'Alice A')
    const b = await signUp(tenantB, email, 'password-for-b', 'Alice B')

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(a.json.user.id).not.toBe(b.json.user.id)
    expect(a.json.user).not.toHaveProperty('tenantId')

    const users = await db
      .select({ id: user.id, tenantId: user.tenantId, name: user.name, role: user.role })
      .from(user)
      .where(eq(user.email, email))
    expect(users).toHaveLength(2)
    expect(new Set(users.map((u) => u.tenantId))).toEqual(
      new Set([tenantA.id, tenantB.id]),
    )
    expect(users.every((u) => u.role === 'learner')).toBe(true)

    const accounts = await db
      .select({ tenantId: account.tenantId, password: account.password })
      .from(account)
      .where(inArray(account.userId, users.map((u) => u.id)))
    expect(accounts).toHaveLength(2)
    expect(accounts[0].password).not.toBe(accounts[1].password)
    for (const row of accounts) {
      const owner = users.find((u) => u.tenantId === row.tenantId)
      expect(owner).toBeDefined()
    }
  })

  it('rejects a duplicate email within the same tenant', async () => {
    const email = uniqueEmail('dup')
    expect((await signUp(tenantA, email, 'password-1')).status).toBe(200)
    const again = await signUp(tenantA, email, 'password-2')
    expect(again.status).toBe(422)
  })

  it("does not accept tenant A's password on tenant B", async () => {
    const email = uniqueEmail('login')
    await signUp(tenantA, email, 'password-for-a')
    await signUp(tenantB, email, 'password-for-b')

    const wrongTenant = await signIn(tenantB, email, 'password-for-a')
    expect(wrongTenant.status).toBe(401)
    expect(wrongTenant.cookie).toBeUndefined()

    expect((await signIn(tenantB, email, 'password-for-b')).status).toBe(200)
    expect((await signIn(tenantA, email, 'password-for-a')).status).toBe(200)
    expect((await signIn(tenantA, email, 'password-for-b')).status).toBe(401)
  })

  it('does not let a user that only exists on tenant A sign in on tenant B', async () => {
    const email = uniqueEmail('only-a')
    await signUp(tenantA, email, 'password-for-a')
    expect((await signIn(tenantB, email, 'password-for-a')).status).toBe(401)
  })

  it('rejects a session token from tenant A on tenant B', async () => {
    const email = uniqueEmail('session')
    await signUp(tenantB, email, 'password-for-b')
    const { cookie, json } = await signUp(tenantA, email, 'password-for-a')
    expect(cookie).toBeDefined()

    const onA = await getSession(tenantA, cookie)
    expect(onA.json.user.id).toBe(json.user.id)

    const onB = await getSession(tenantB, cookie)
    expect(onB.status).toBe(200)
    expect(onB.json).toBeNull()

    const viaApi = await runWithTenant(tenantB, () =>
      auth.api.getSession({ headers: new Headers({ cookie: cookie! }) }),
    )
    expect(viaApi).toBeNull()

    const [row] = await db
      .select({ tenantId: session.tenantId })
      .from(session)
      .where(eq(session.token, json.token))
    expect(row.tenantId).toBe(tenantA.id)
  })

  it("cannot sign out or revoke tenant A's session from tenant B", async () => {
    const email = uniqueEmail('signout')
    const { cookie, json } = await signUp(tenantA, email, 'password-for-a')

    await call(tenantB, '/sign-out', { method: 'POST', body: {}, cookie })
    await call(tenantB, '/revoke-session', {
      body: { token: json.token },
      cookie,
    })

    const stillValid = await getSession(tenantA, cookie)
    expect(stillValid.json?.user.id).toBe(json.user.id)
  })

  it("only lists the current tenant's sessions", async () => {
    const email = uniqueEmail('list')
    const a = await signUp(tenantA, email, 'password-for-a')
    await signUp(tenantB, email, 'password-for-b')
    await signIn(tenantB, email, 'password-for-b')

    const sessions = await call(tenantA, '/list-sessions', { cookie: a.cookie })
    expect(sessions.status).toBe(200)
    expect(sessions.json).toHaveLength(1)
    expect(sessions.json[0].userId).toBe(a.json.user.id)
  })

  it('scopes password reset tokens to the tenant that issued them', async () => {
    const email = uniqueEmail('reset')
    await signUp(tenantA, email, 'password-for-a')
    await signUp(tenantB, email, 'password-for-b')

    const requested = await call(tenantA, '/request-password-reset', {
      body: { email, redirectTo: '/reset-password' },
    })
    expect(requested.status).toBe(200)
    expect(outbox).toHaveLength(1)
    const [mail] = outbox
    expect(mail.tenantId).toBe(tenantA.id)
    expect(mail.url).toContain(`http://${hostOf(tenantA)}/api/auth/reset-password/`)

    const verificationRows = await db
      .select({ tenantId: verification.tenantId })
      .from(verification)
      .where(eq(verification.tenantId, tenantA.id))
    expect(verificationRows.length).toBeGreaterThan(0)

    const onB = await call(tenantB, '/reset-password', {
      body: { token: mail.token, newPassword: 'hijacked-password' },
    })
    expect(onB.status).toBe(400)
    expect(onB.json.code).toBe('INVALID_TOKEN')
    expect((await signIn(tenantB, email, 'hijacked-password')).status).toBe(401)
    expect((await signIn(tenantB, email, 'password-for-b')).status).toBe(200)

    const onA = await call(tenantA, '/reset-password', {
      body: { token: mail.token, newPassword: 'new-password-for-a' },
    })
    expect(onA.status).toBe(200)
    expect((await signIn(tenantA, email, 'new-password-for-a')).status).toBe(200)
    expect((await signIn(tenantA, email, 'password-for-a')).status).toBe(401)
    expect((await signIn(tenantB, email, 'password-for-b')).status).toBe(200)
  })

  it('does not send a reset email for an address that only exists on another tenant', async () => {
    const email = uniqueEmail('reset-other')
    await signUp(tenantA, email, 'password-for-a')
    await call(tenantB, '/request-password-reset', {
      body: { email, redirectTo: '/reset-password' },
    })
    expect(outbox).toHaveLength(0)
  })

  it('keeps the stateless email verification endpoints disabled', async () => {
    const res = await call(tenantA, '/verify-email?token=anything')
    expect(res.status).toBe(404)
    const send = await call(tenantA, '/send-verification-email', {
      body: { email: uniqueEmail('verify') },
    })
    expect(send.status).toBe(404)
  })

  it('rejects state-changing requests from another tenant origin', async () => {
    const email = uniqueEmail('origin')
    await signUp(tenantA, email, 'password-for-a')
    const res = await call(tenantA, '/sign-in/email', {
      body: { email, password: 'password-for-a' },
      origin: `http://${hostOf(tenantB)}`,
    })
    expect(res.status).toBe(403)
    expect(res.json.code).toBe('INVALID_ORIGIN')
  })

  it('sets host-only session cookies', async () => {
    const request = new Request(`http://${hostOf(tenantA)}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        host: hostOf(tenantA),
        origin: `http://${hostOf(tenantA)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: uniqueEmail('cookie'),
        password: 'password-for-a',
        name: 'Cookie',
      }),
    })
    const response = await runWithTenant(tenantA, () => auth.handler(request))
    const cookies = response.headers.getSetCookie()
    expect(cookies.length).toBeGreaterThan(0)
    for (const cookie of cookies) expect(cookie.toLowerCase()).not.toContain('domain=')
  })

  it('refuses to touch auth tables without a tenant in context', async () => {
    await expect(
      auth.api.signUpEmail({
        body: { email: uniqueEmail('nocontext'), password: 'password-1', name: 'X' },
      }),
    ).rejects.toThrow(TenantContextError)

    const count = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.name, 'X'), inArray(user.tenantId, [tenantA.id, tenantB.id])))
    expect(count).toHaveLength(0)
  })

  it('rejects cross-tenant rows at the database level', async () => {
    const email = uniqueEmail('fk')
    const a = await signUp(tenantA, email, 'password-for-a')
    await expect(
      db.insert(session).values({
        id: randomUUID(),
        tenantId: tenantB.id,
        userId: a.json.user.id,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow()
  })
})
