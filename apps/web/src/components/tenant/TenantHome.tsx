import type { TenantInfo } from '#/lib/tenancy/site'

export function TenantHome({ tenant }: { tenant: TenantInfo }) {
  return (
    <main className="page-wrap px-4 py-16">
      <section className="mx-auto max-w-2xl text-center">
        <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Academy
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {tenant.name}
        </h1>
        <p className="text-muted-foreground">
          Courses for this academy will appear here.
        </p>
      </section>
    </main>
  )
}
