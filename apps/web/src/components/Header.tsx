import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { GET_STARTED_HREF } from '#/components/marketing/links'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl">
      <nav className="page-wrap flex items-center justify-between gap-3 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground no-underline shadow-sm sm:px-4 sm:py-2"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              N
            </span>
            Notilearn
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
          <Button asChild size="sm">
            <a href={GET_STARTED_HREF}>Get Started</a>
          </Button>
        </div>
      </nav>
    </header>
  )
}
