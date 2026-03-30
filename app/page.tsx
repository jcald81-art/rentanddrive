import Script from "next/script"
import { getOrganizationSchema, getWebsiteSchema, getLocalBusinessSchema } from '@/lib/structured-data'
import {
  ExpeditionNavbar,
  ExpeditionHero,
  TrustBar,
  VehiclesSection,
  WhyRADSection,
  AgentsSection,
  MarketsSection,
  HostCTASection,
  ExpeditionFooter,
} from '@/components/expedition'

export default function HomePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteSchema()) }}
      />
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessSchema()) }}
      />

      <main>
        {/* Navigation */}
        <ExpeditionNavbar />

        {/* Hero Section - Dark */}
        <ExpeditionHero />

        {/* Trust Bar - Amber */}
        <TrustBar />

        {/* Vehicles Section - Light (Parchment) */}
        <VehiclesSection />

        {/* Why RAD Section - Dark */}
        <WhyRADSection />

        {/* AI Agents Section - Light (Parchment) */}
        <AgentsSection />

        {/* Markets Section - Light (Parchment) */}
        <MarketsSection />

        {/* Host CTA Section - Forest Green */}
        <HostCTASection />

        {/* Footer - Dark */}
        <ExpeditionFooter />
      </main>
    </>
  )
}
