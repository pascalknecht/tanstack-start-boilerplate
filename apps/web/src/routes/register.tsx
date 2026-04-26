import { Link, createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : '/',
  }),
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { redirect } = useSearch({ from: '/register' })
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const { error: registerError } = await authClient.signUp.email({
      name,
      email: `${username.toLowerCase()}@local.invalid`,
      username,
      password,
    })

    setIsSubmitting(false)

    if (registerError) {
      setError(registerError.message ?? 'Could not create account')
      return
    }

    if (redirect.startsWith('/')) {
      navigate({ to: redirect })
      return
    }

    navigate({ to: '/' })
  }

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell mx-auto max-w-md rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Register</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)]">
          Create account
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Sign up with username and password.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-semibold text-[var(--sea-ink)]">
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Your name"
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--sea-ink)]">
            Username
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="jane_doe"
            />
          </label>

          <label className="block text-sm font-semibold text-[var(--sea-ink)]">
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="********"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-[var(--sea-ink-soft)]">
          Already registered?{' '}
          <Link
            to="/login"
            search={{ redirect }}
            className="font-semibold text-slate-900"
          >
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}
