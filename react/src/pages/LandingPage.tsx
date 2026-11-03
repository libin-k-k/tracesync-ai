import { LandingCta } from '../components/landing/LandingCta'
import { LandingFaq } from '../components/landing/LandingFaq'
import { LandingFeatures } from '../components/landing/LandingFeatures'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHero } from '../components/landing/LandingHero'
import { LandingHowItWorks } from '../components/landing/LandingHowItWorks'
import { LandingLogos } from '../components/landing/LandingLogos'
import { LandingNav } from '../components/landing/LandingNav'
import { LandingPricing } from '../components/landing/LandingPricing'
import { LandingTestimonials } from '../components/landing/LandingTestimonials'

export function LandingPage() {
  return (
    <div className="app-shell landing-page">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
