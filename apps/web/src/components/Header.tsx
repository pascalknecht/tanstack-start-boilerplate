import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { authClient } from '../lib/auth-client'

export default function Header() {
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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl">
      <nav className="page-wrap flex items-center justify-between gap-3 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground no-underline shadow-sm sm:px-4 sm:py-2"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              S
            </span>
            Sample Logo
          </Link>
        </h2>

        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Pricing
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register" search={{ redirect: '/' }}>
              Get Started
            </Link>
          </Button>
          {!isPending && session ? (
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
          ) : null}
        </div>
      </nav>
    </header>
  )
}
