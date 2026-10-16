export function NotFound() {
  return (
    <main className="page-wrap flex min-h-[60vh] items-center justify-center px-4 py-16">
      <section className="max-w-md text-center">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground">
          There is nothing here. Check the address, or the academy may no longer
          exist.
        </p>
      </section>
    </main>
  )
}
