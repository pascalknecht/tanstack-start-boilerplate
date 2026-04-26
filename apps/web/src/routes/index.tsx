import { createFileRoute } from '@tanstack/react-router'
import { CallToAction } from '../components/marketing/call-to-action'
import { FeaturesSection } from '../components/marketing/features'
import { HeroSection } from '../components/marketing/hero'
import { PricingSection } from '../components/marketing/pricing'
import { SocialProof } from '../components/marketing/social-proof'

export const Route = createFileRoute('/')({ component: App })

function App() {
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
