import { createFileRoute } from '@tanstack/react-router'
import { assertRootSite } from '#/lib/tenancy/guards'

export const Route = createFileRoute('/about')({
  beforeLoad: ({ context }) => assertRootSite(context.site),
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Courses, straight from Notion.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          Notilearn turns your Notion pages into a branded e-learning academy.
          Import a course, invite your learners, and keep writing in the tool
          you already use.
        </p>
      </section>
    </main>
  )
}
