import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = Route.useRouteContext()

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Settings</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Account Settings
        </h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Signed in as <span className="font-semibold">{user.name}</span> (
          {user.email}).
        </p>
      </section>
    </main>
  )
}
