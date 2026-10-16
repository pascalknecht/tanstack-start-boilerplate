import {
  boolean,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

export const userRole = pgEnum('user_role', ['owner', 'admin', 'learner'])

export const tenant = pgTable('tenant', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

const tenantId = () =>
  text('tenant_id')
    .notNull()
    .references(() => tenant.id, { onDelete: 'cascade' })

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    tenantId: tenantId(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: userRole('role').notNull().default('learner'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('user_tenant_id_email_unique').on(t.tenantId, t.email),
    // Target for the composite foreign keys below, so rows can only point at a
    // user of the same tenant.
    unique('user_tenant_id_id_unique').on(t.tenantId, t.id),
  ],
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    tenantId: tenantId(),
    userId: text('user_id').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId, t.userId],
      foreignColumns: [user.tenantId, user.id],
    }).onDelete('cascade'),
    index('session_tenant_id_user_id_idx').on(t.tenantId, t.userId),
  ],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    tenantId: tenantId(),
    userId: text('user_id').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId, t.userId],
      foreignColumns: [user.tenantId, user.id],
    }).onDelete('cascade'),
    index('account_tenant_id_user_id_idx').on(t.tenantId, t.userId),
    uniqueIndex('account_tenant_id_provider_id_account_id_unique').on(
      t.tenantId,
      t.providerId,
      t.accountId,
    ),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    tenantId: tenantId(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('verification_tenant_id_identifier_idx').on(t.tenantId, t.identifier),
  ],
)

export const handoffToken = pgTable(
  'handoff_token',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tenantId: tenantId(),
    userId: text('user_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    redirectTo: text('redirect_to'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.tenantId, t.userId],
      foreignColumns: [user.tenantId, user.id],
    }).onDelete('cascade'),
  ],
)

export type Tenant = typeof tenant.$inferSelect
export type UserRole = (typeof userRole.enumValues)[number]
