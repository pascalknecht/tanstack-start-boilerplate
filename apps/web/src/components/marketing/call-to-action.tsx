import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export function CallToAction() {
  return (
    <section className="border-t border-border py-20 md:py-28">
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-16 text-center text-primary-foreground md:py-20">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to transform your workflow?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base text-primary-foreground/90">
            Join thousands of teams already shipping faster. Start your free
            trial today - no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="secondary" size="lg">
              <Link to="/register" search={{ redirect: '/' }}>
                Start Free Trial
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
