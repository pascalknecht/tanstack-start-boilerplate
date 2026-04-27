'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

function FloatingCard({
  title,
  className,
  children,
  delay = 0,
  angle,
  radius,
}: {
  title: string
  className?: string
  children: ReactNode
  delay?: number
  angle: number
  radius: number
}) {
  const orbitStyles = {
    '--orbit-angle': `${angle}deg`,
    '--orbit-radius': `${radius}px`,
    animation: `orbit 26s linear ${delay}s infinite`,
  } as CSSProperties

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" style={orbitStyles}>
      <div
        className={`pointer-events-auto rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur ${className ?? ''}`}
        style={{
          animation: `float 6s ease-in-out ${delay}s infinite`,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="size-2 rounded-full bg-muted-foreground/40" />
            <div className="size-2 rounded-full bg-muted-foreground/55" />
            <div className="size-2 rounded-full bg-muted-foreground/70" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{title}</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-24 pt-20 md:pb-36 md:pt-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,theme(colors.primary/25),transparent_70%)]" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <Badge
              variant="outline"
              className="h-auto items-center gap-1.5 rounded-full border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <Sparkles className="size-3" />
              Now in Public Beta
            </Badge>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
            The modern platform
            <br />
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              for growing teams
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground md:text-lg">
            Streamline your workflow, collaborate seamlessly, and ship faster
            with an all-in-one platform built for modern SaaS teams.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register" search={{ redirect: '/dashboard' }}>
                Start Free Trial
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">See How It Works</a>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required &middot; 14-day free trial &middot; Cancel
            anytime
          </p>
        </div>

        <div className="relative mx-auto mt-20 h-[360px] max-w-5xl md:h-[440px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-full max-w-2xl rounded-3xl border border-border bg-card/95 shadow-2xl backdrop-blur-sm md:h-80">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-muted-foreground/40" />
                  <div className="size-2.5 rounded-full bg-muted-foreground/55" />
                  <div className="size-2.5 rounded-full bg-muted-foreground/70" />
                </div>
                <span className="text-xs text-muted-foreground">Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5">
                <div className="space-y-3">
                  <div className="h-3 w-3/4 rounded bg-muted/90" />
                  <div className="h-8 rounded-lg bg-primary/15" />
                  <div className="h-8 rounded-lg bg-muted/90" />
                  <div className="h-8 rounded-lg bg-muted/90" />
                </div>
                <div className="col-span-2 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-20 flex-1 rounded-lg bg-muted/50 p-3">
                      <div className="mb-2 h-2 w-12 rounded bg-muted-foreground/25" />
                      <div className="text-xl font-bold text-foreground">
                        2,847
                      </div>
                    </div>
                    <div className="h-20 flex-1 rounded-lg bg-muted/50 p-3">
                      <div className="mb-2 h-2 w-12 rounded bg-muted-foreground/25" />
                      <div className="text-xl font-bold text-foreground">
                        94.2%
                      </div>
                    </div>
                  </div>
                  <div className="h-24 rounded-lg bg-background p-3 md:h-36">
                    <div className="flex h-full items-end gap-1.5">
                      {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-primary/35"
                            style={{ height: `${h}%` }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FloatingCard
            title="Analytics"
            className="w-44 md:w-52"
            delay={0}
            angle={210}
            radius={220}
          >
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">MRR</span>
                <span className="text-xs font-medium text-primary">+12.5%</span>
              </div>
              <div className="text-lg font-bold text-foreground">$48.2K</div>
              <div className="flex h-8 items-end gap-0.5">
                {[30, 45, 35, 60, 50, 70, 65, 80, 75, 90].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-primary/35"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            title="Team Activity"
            className="w-48 md:w-56"
            delay={2}
            angle={15}
            radius={235}
          >
            <div className="space-y-2">
              {['Sarah K.', 'Mike R.', 'Anna L.'].map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="text-[10px] font-medium">{name}</div>
                    <div className="h-1 rounded bg-muted">
                      <div
                        className="h-1 rounded bg-primary/75"
                        style={{ width: `${80 - i * 15}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FloatingCard>

          <FloatingCard
            title="Notifications"
            className="w-44 md:w-48"
            delay={4}
            angle={135}
            radius={230}
          >
            <div className="space-y-1.5">
              {[
                'New signup from acme.co',
                'Invoice #1042 paid',
                'Deploy succeeded',
              ].map((msg, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded bg-muted/70 px-2 py-1"
                >
                  <div className="size-1.5 rounded-full bg-primary" />
                  <span className="text-[9px] text-muted-foreground">{msg}</span>
                </div>
              ))}
            </div>
          </FloatingCard>

          <FloatingCard
            title="Integrations"
            className="w-40 md:w-44"
            delay={1}
            angle={305}
            radius={235}
          >
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex size-8 items-center justify-center rounded-lg bg-muted/70"
                >
                  <div className="size-4 rounded bg-primary/30" />
                </div>
              ))}
            </div>
          </FloatingCard>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-11px); }
        }

        @keyframes orbit {
          from {
            transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius))
              rotate(calc(var(--orbit-angle) * -1));
          }
          to {
            transform: rotate(calc(var(--orbit-angle) + 1turn)) translateX(var(--orbit-radius))
              rotate(calc((var(--orbit-angle) + 1turn) * -1));
          }
        }
      `}</style>
    </section>
  )
}
