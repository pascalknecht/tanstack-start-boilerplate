import { createFileRoute } from '@tanstack/react-router'
import { CallToAction } from '#/components/marketing/call-to-action'
import { FeaturesSection } from '#/components/marketing/features'
import { HeroSection } from '#/components/marketing/hero'
import { PricingSection } from '#/components/marketing/pricing'
import { SocialProof } from '#/components/marketing/social-proof'
import { TenantHome } from '#/components/tenant/TenantHome'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { site } = Route.useRouteContext()

  if (site.kind === 'tenant') return <TenantHome tenant={site.tenant} />

  return (
    <div>
      <HeroSection />
      <SocialProof />
      <FeaturesSection />
      <PricingSection />
      <CallToAction />
    </div>
  )
}
