export type TenantInfo = {
  id: string
  slug: string
  name: string
}

export type Site =
  | { kind: 'root' }
  | { kind: 'tenant'; tenant: TenantInfo }
  | { kind: 'not-found' }
