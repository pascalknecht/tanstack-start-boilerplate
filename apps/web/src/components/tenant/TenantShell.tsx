import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'
import type { TenantInfo } from '#/lib/tenancy/site'

export function TenantShell({
  tenant,
  children,
}: {
  tenant: TenantInfo
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TenantHeader tenant={tenant} />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {tenant.name} &middot; Powered by Notilearn
      </footer>
    </div>
  )
}

function TenantHeader({ tenant }: { tenant: TenantInfo }) {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function onSignOut() {
    setIsSigningOut(true)
    await authClient.signOut()
    setIsSigningOut(false)
    navigate({ to: '/login' })
  }

  return (
    <header className="border-b border-border/70 bg-background px-4">
      <nav className="page-wrap flex items-center justify-between gap-3 py-3 sm:py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground no-underline"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground uppercase">
            {tenant.name.slice(0, 1)}
          </span>
          {tenant.name}
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isPending ? null : session ? (
            <>
              <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
                {session.user.name}
              </span>
              <Button asChild size="sm" variant="ghost">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register" search={{ redirect: '/dashboard' }}>
                  Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
