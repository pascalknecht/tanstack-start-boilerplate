import type {
  BetterAuthOptions,
  DBAdapter,
  DBTransactionAdapter,
  Where,
} from 'better-auth'
import { TenantContextError } from './context'

export const TENANT_SCOPED_MODELS = [
  'user',
  'session',
  'account',
  'verification',
] as const

export const TENANT_FIELD = 'tenantId'

type AdapterFactory = (options: BetterAuthOptions) => DBAdapter<BetterAuthOptions>

export type TenantScopeOptions = {
  getTenantId: () => string | null | undefined
  scopedModels?: readonly string[]
  // Models that are intentionally shared by all tenants. Anything that is
  // neither scoped nor global is rejected, so a plugin that adds a table
  // cannot silently bypass tenant isolation.
  globalModels?: readonly string[]
}

export function withTenantScope(
  createAdapter: AdapterFactory,
  {
    getTenantId,
    scopedModels = TENANT_SCOPED_MODELS,
    globalModels = ['rateLimit'],
  }: TenantScopeOptions,
): AdapterFactory {
  const scoped = new Set(scopedModels)
  const global = new Set(globalModels)

  function tenantFor(model: string): string | null {
    if (global.has(model)) return null
    if (!scoped.has(model)) {
      throw new Error(
        `[tenant-scope] Model "${model}" is neither tenant-scoped nor global.`,
      )
    }
    const tenantId = getTenantId()
    if (!tenantId) {
      throw new TenantContextError(
        `[tenant-scope] Refusing to access "${model}" without a tenant in context.`,
      )
    }
    return tenantId
  }

  function scopeWhere(tenantId: string, where: Where[] | undefined): Where[] {
    return [
      ...(where ?? []),
      { field: TENANT_FIELD, operator: 'eq', value: tenantId, connector: 'AND' },
    ]
  }

  function assertSameTenant(
    tenantId: string,
    data: Record<string, unknown>,
    model: string,
  ) {
    const value = data[TENANT_FIELD]
    if (value !== undefined && value !== tenantId) {
      throw new TenantContextError(
        `[tenant-scope] Refusing to write "${model}" for another tenant.`,
      )
    }
  }

  function scope<A extends DBTransactionAdapter<BetterAuthOptions>>(
    adapter: A,
  ): DBTransactionAdapter<BetterAuthOptions> {
    return {
      ...adapter,
      create(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.create(args)
        assertSameTenant(tenantId, args.data, args.model)
        return adapter.create({
          ...args,
          data: { ...args.data, [TENANT_FIELD]: tenantId },
        })
      },
      findOne(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.findOne(args)
        return adapter.findOne({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      findMany(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.findMany(args)
        return adapter.findMany({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      count(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.count(args)
        return adapter.count({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      update(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.update(args)
        assertSameTenant(tenantId, args.update, args.model)
        return adapter.update({
          ...args,
          where: scopeWhere(tenantId, args.where),
          update: withoutTenantField(args.update),
        })
      },
      updateMany(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.updateMany(args)
        assertSameTenant(tenantId, args.update, args.model)
        return adapter.updateMany({
          ...args,
          where: scopeWhere(tenantId, args.where),
          update: withoutTenantField(args.update),
        })
      },
      delete(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.delete(args)
        return adapter.delete({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      deleteMany(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.deleteMany(args)
        return adapter.deleteMany({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      consumeOne(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.consumeOne(args)
        return adapter.consumeOne({ ...args, where: scopeWhere(tenantId, args.where) })
      },
      incrementOne(args) {
        const tenantId = tenantFor(args.model)
        if (!tenantId) return adapter.incrementOne(args)
        assertSameTenant(tenantId, args.set ?? {}, args.model)
        return adapter.incrementOne({
          ...args,
          where: scopeWhere(tenantId, args.where),
          set: args.set && withoutTenantField(args.set),
        })
      },
    }
  }

  return (options) => {
    const adapter = createAdapter(options)
    return {
      ...scope(adapter),
      // Without this, Better Auth hands transaction callbacks the raw adapter.
      transaction: (callback) =>
        adapter.transaction((trx) => callback(scope(trx))),
    }
  }
}

function withoutTenantField<T extends Record<string, unknown>>(data: T): T {
  if (!(TENANT_FIELD in data)) return data
  const { [TENANT_FIELD]: _, ...rest } = data
  return rest as T
}
