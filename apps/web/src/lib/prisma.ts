import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getAuthTables, type DBFieldAttribute, type BetterAuthDBSchema } from 'better-auth/db'
import { PGlite } from '@electric-sql/pglite'
import { PrismaClient } from '@prisma/client'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { username } from 'better-auth/plugins'

const WEB_APP_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
const prismaDataDir = process.env.DATABASE_DIR ?? path.join(WEB_APP_ROOT, '.pglite')

await mkdir(prismaDataDir, { recursive: true })

const pgliteClient = new PGlite({ dataDir: prismaDataDir })
const adapter = new PrismaPGlite(pgliteClient)

const globalForPrisma = globalThis as typeof globalThis & {
  __prismaClient?: PrismaClient
  __prismaReadyPromise?: Promise<void>
}

export const prisma = globalForPrisma.__prismaClient ?? new PrismaClient({ adapter })

if (!globalForPrisma.__prismaClient) {
  globalForPrisma.__prismaClient = prisma
}

const initializePrismaSchema = async () => {
  const authTables = getAuthTables({
    plugins: [username()],
  }) as BetterAuthDBSchema
  for (const [tableName, tableConfig] of Object.entries(authTables) as Array<[string, { fields: Record<string, DBFieldAttribute> }]>) {
    const columns = ['"id" TEXT PRIMARY KEY']
    const indexes: string[] = []
    for (const [fieldName, fieldConfig] of Object.entries(tableConfig.fields) as Array<[string, DBFieldAttribute]>) {
      const mappedType = fieldConfig.type === 'date'
        ? 'TIMESTAMPTZ'
        : fieldConfig.type === 'boolean'
          ? 'BOOLEAN'
          : fieldConfig.type === 'number'
            ? 'INTEGER'
            : 'TEXT'
      const references = fieldConfig.references
        ? ` REFERENCES "${fieldConfig.references.model}" ("${fieldConfig.references.field}")`
          + ` ON DELETE ${fieldConfig.references.onDelete?.toUpperCase() ?? 'CASCADE'}`
        : ''
      const defaultValue = fieldConfig.defaultValue === false
        ? ' DEFAULT FALSE'
        : fieldConfig.type === 'date' && typeof fieldConfig.defaultValue === 'function'
          ? ' DEFAULT CURRENT_TIMESTAMP'
          : ''
      const required = fieldConfig.required === true ? ' NOT NULL' : ''
      const unique = fieldConfig.unique === true ? ' UNIQUE' : ''
      columns.push(`"${fieldName}" ${mappedType}${references}${defaultValue}${required}${unique}`)
      if (fieldConfig.index) {
        indexes.push(
          `CREATE INDEX IF NOT EXISTS "${tableName}_${fieldName}_idx" ON "${tableName}" ("${fieldName}");`,
        )
      }
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${columns.join(',\n        ')}
      );
    `)

    for (const indexSql of indexes) {
      await prisma.$executeRawUnsafe(indexSql)
    }
  }
}

export const prismaReady = globalForPrisma.__prismaReadyPromise ?? initializePrismaSchema()

if (!globalForPrisma.__prismaReadyPromise) {
  globalForPrisma.__prismaReadyPromise = prismaReady
}

export const closePrismaDb = async () => {
  await prisma.$disconnect()
  await pgliteClient.close()
}
