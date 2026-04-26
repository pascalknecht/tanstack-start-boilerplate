import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function CallToAction() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-neutral-900 px-8 py-16 text-center text-white md:px-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to transform your workflow?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base text-white/80">
            Join thousands of teams already shipping faster. Start your free
            trial today - no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              search={{ redirect: '/' }}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              Start Free Trial
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
