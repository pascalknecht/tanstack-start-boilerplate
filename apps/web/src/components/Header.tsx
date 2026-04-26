import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
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
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center justify-between gap-3 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:px-4 sm:py-2"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#334155)] text-xs font-bold text-white">
              S
            </span>
            Sample Logo
          </Link>
        </h2>

        <div className="hidden items-center gap-1 md:flex">
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
          >
            Pricing
          </a>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <Link
            to="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
          >
            Login
          </Link>
          <Link
            to="/register"
            search={{ redirect: '/' }}
            className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Get Started
          </Link>
          {!isPending && session ? (
            <>
              <span className="hidden text-xs font-semibold text-[var(--sea-ink-soft)] sm:inline">
                {session.user.name}
              </span>
              <Link
                to="/dashboard"
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition-colors hover:text-[var(--sea-ink)]"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                disabled={isSigningOut}
                className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  )
}
