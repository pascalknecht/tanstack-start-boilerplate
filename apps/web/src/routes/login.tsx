import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'
import { getSession } from '../lib/auth-helpers'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession()

    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error } = await authClient.signIn.username({
      username,
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message || 'Unable to sign in.')
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell mx-auto max-w-xl rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Sign In</p>
        <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Login
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Use your username and password to sign in.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--sea-ink)]">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none ring-[rgba(15,23,42,0.2)] focus:ring-2"
              placeholder="your_username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--sea-ink)]">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm outline-none ring-[rgba(15,23,42,0.2)] focus:ring-2"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-300/60 bg-red-100/60 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full border border-[rgba(15,23,42,0.2)] bg-[rgba(15,23,42,0.06)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(15,23,42,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--sea-ink-soft)]">
          Need an account?{' '}
          <Link to="/register" search={{ redirect: '/dashboard' }} className="font-semibold">
            Register
          </Link>
        </p>
      </section>
    </main>
  )
}
