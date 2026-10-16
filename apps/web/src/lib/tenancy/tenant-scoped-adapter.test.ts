import type { BetterAuthOptions, DBAdapter } from 'better-auth'
import { describe, expect, it, vi } from 'vitest'
import { TenantContextError } from './context'
import { withTenantScope } from './tenant-scoped-adapter'

const tenantFilter = (value: string) => ({
  field: 'tenantId',
  operator: 'eq',
  value,
  connector: 'AND',
})

function fakeAdapter() {
  const calls: Array<{ method: string; args: any }> = []
  const record =
    (method: string, result: unknown = null) =>
    async (args: unknown) => {
      calls.push({ method, args })
      return result
    }
  const adapter = {
    id: 'fake',
    create: record('create', {}),
    findOne: record('findOne'),
    findMany: record('findMany', []),
    count: record('count', 0),
    update: record('update'),
    updateMany: record('updateMany', 0),
    delete: record('delete'),
    deleteMany: record('deleteMany', 0),
    consumeOne: record('consumeOne'),
    incrementOne: record('incrementOne'),
    transaction: vi.fn(async (callback: (trx: unknown) => Promise<unknown>) =>
      callback(adapter),
    ),
  }
  return { adapter: adapter as unknown as DBAdapter<BetterAuthOptions>, calls }
}

function setup(tenantId: string | null = 'tenant-a') {
  const fake = fakeAdapter()
  const createScoped = withTenantScope(() => fake.adapter, {
    getTenantId: () => tenantId,
  })
  return { ...fake, scoped: createScoped({} as BetterAuthOptions) }
}

describe('withTenantScope', () => {
  it('stamps the tenant on create', async () => {
    const { scoped, calls } = setup()
    await scoped.create({ model: 'user', data: { email: 'a@example.com' } })
    expect(calls[0].args.data).toEqual({
      email: 'a@example.com',
      tenantId: 'tenant-a',
    })
  })

  it('refuses to create rows for another tenant', async () => {
    const { scoped, calls } = setup()
    expect(() =>
      scoped.create({ model: 'session', data: { tenantId: 'tenant-b' } }),
    ).toThrow(TenantContextError)
    expect(calls).toHaveLength(0)
  })

  it.each(['findOne', 'findMany', 'count', 'delete', 'deleteMany', 'consumeOne'] as const)(
    'adds the tenant filter to %s',
    async (method) => {
      const { scoped, calls } = setup()
      const where = [{ field: 'email', value: 'a@example.com' }]
      await (scoped[method] as (args: unknown) => Promise<unknown>)({
        model: 'user',
        where,
      })
      expect(calls[0].args.where).toEqual([...where, tenantFilter('tenant-a')])
    },
  )

  it('adds the tenant filter when findMany has no where clause', async () => {
    const { scoped, calls } = setup()
    await scoped.findMany({ model: 'session' })
    expect(calls[0].args.where).toEqual([tenantFilter('tenant-a')])
  })

  it.each(['update', 'updateMany'] as const)(
    'scopes %s and never rewrites tenantId',
    async (method) => {
      const { scoped, calls } = setup()
      await scoped[method]({
        model: 'user',
        where: [{ field: 'id', value: 'u1' }],
        update: { name: 'New', tenantId: 'tenant-a' },
      })
      expect(calls[0].args.where).toEqual([
        { field: 'id', value: 'u1' },
        tenantFilter('tenant-a'),
      ])
      expect(calls[0].args.update).toEqual({ name: 'New' })
    },
  )

  it('refuses to move rows to another tenant', () => {
    const { scoped } = setup()
    expect(() =>
      scoped.update({
        model: 'user',
        where: [{ field: 'id', value: 'u1' }],
        update: { tenantId: 'tenant-b' },
      }),
    ).toThrow(TenantContextError)
  })

  it('scopes incrementOne', async () => {
    const { scoped, calls } = setup()
    await scoped.incrementOne({
      model: 'verification',
      where: [{ field: 'id', value: 'v1' }],
      increment: { attempts: 1 },
    })
    expect(calls[0].args.where).toEqual([
      { field: 'id', value: 'v1' },
      tenantFilter('tenant-a'),
    ])
  })

  it('throws for scoped models when no tenant is in context', async () => {
    const { scoped, calls } = setup(null)
    for (const model of ['user', 'session', 'account', 'verification']) {
      expect(() => scoped.findOne({ model, where: [] })).toThrow(TenantContextError)
      expect(() => scoped.create({ model, data: {} })).toThrow(TenantContextError)
    }
    expect(calls).toHaveLength(0)
  })

  it('passes global models through untouched', async () => {
    const { scoped, calls } = setup(null)
    const where = [{ field: 'key', value: '127.0.0.1' }]
    await scoped.findOne({ model: 'rateLimit', where })
    expect(calls[0].args.where).toBe(where)
  })

  it('rejects models that are neither scoped nor global', () => {
    const { scoped } = setup()
    expect(() => scoped.findOne({ model: 'twoFactor', where: [] })).toThrow(
      /neither tenant-scoped nor global/,
    )
  })

  it('scopes the adapter handed to transaction callbacks', async () => {
    const { scoped, calls } = setup()
    await scoped.transaction(async (trx) => {
      await trx.findOne({ model: 'user', where: [] })
    })
    expect(calls[0].args.where).toEqual([tenantFilter('tenant-a')])
  })
})
