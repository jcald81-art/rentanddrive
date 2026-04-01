'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 29, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              Rent and Drive LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting 
              your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our peer-to-peer car rental platform.
            </p>
            <p>
              This policy complies with the General Data Protection Regulation (GDPR) for users in the 
              European Union and the California Consumer Privacy Act (CCPA) for California residents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data We Collect</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, phone number</li>
              <li>Physical address and billing information</li>
              <li>Driver&apos;s license information and verification documents</li>
              <li>Payment information (processed by Stripe)</li>
              <li>Profile photos and identity verification images</li>
              <li>Date of birth and demographic information</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">Vehicle Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vehicle identification number (VIN)</li>
              <li>Make, model, year, and specifications</li>
              <li>Registration and insurance documents</li>
              <li>Vehicle photos and condition reports</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">Usage Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address and browser information</li>
              <li>Device identifiers and mobile device data</li>
              <li>Platform usage patterns and preferences</li>
              <li>Search queries and booking history</li>
              <li>Communications through our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">RADar Data Usage and Retention</h2>
            <p>
              Our RADar Fleet Tracking System, powered by Bouncie GPS devices, collects the following 
              telematics data during rental periods:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Location data:</strong> Real-time GPS coordinates updated every 15 seconds during active trips</li>
              <li><strong>Trip data:</strong> Start/end times, routes traveled, total mileage</li>
              <li><strong>Driving behavior:</strong> Speed, hard braking events, rapid acceleration</li>
              <li><strong>Vehicle diagnostics:</strong> Engine status, battery level, check engine codes</li>
              <li><strong>Geofence events:</strong> Entry/exit from designated geographic boundaries</li>
            </ul>
            <p className="mt-4">
              <strong>Retention period:</strong> GPS and telematics data is retained for 90 days following 
              the completion of each rental. After this period, data is anonymized and aggregated for 
              platform analytics. Data related to accidents, claims, or disputes may be retained longer 
              as required for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Bouncie Data Sharing</h2>
            <p>
              We share limited data with Bouncie, Inc. as our telematics provider:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device identifiers and vehicle associations</li>
              <li>Location and trip data for processing</li>
              <li>Diagnostic alerts and notifications</li>
            </ul>
            <p>
              Bouncie processes this data according to their own privacy policy. We maintain a Data 
              Processing Agreement with Bouncie that requires them to protect your data and use it only 
              for providing services to us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">AI Vehicle Inspection Photo Storage</h2>
            <p>
              Pre-trip and post-trip inspection photos are:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stored securely on encrypted cloud servers</li>
              <li>Retained for 90 days following rental completion</li>
              <li>Used for damage assessment and dispute resolution</li>
              <li>Processed by AI for automated damage detection</li>
              <li>Accessible only to relevant Hosts, Renters, and authorized support staff</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate vehicle rentals and process payments</li>
              <li>Verify identities and prevent fraud</li>
              <li>Provide customer support and resolve disputes</li>
              <li>Send booking confirmations and important notifications</li>
              <li>Improve our platform and develop new features</li>
              <li>Monitor safety and enforce platform policies</li>
              <li>Calculate Renter Road scores and Host ratings</li>
              <li>Generate market insights and pricing recommendations</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Third Party Sharing</h2>
            <p>We share data with the following service providers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Stripe:</strong> Payment processing and payout services</li>
              <li><strong>Twilio:</strong> SMS notifications and communications</li>
              <li><strong>SendGrid:</strong> Email delivery services</li>
              <li><strong>Tint Insurance:</strong> Insurance coverage and claims processing</li>
              <li><strong>Bouncie:</strong> GPS tracking and telematics services</li>
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Vercel:</strong> Application hosting and analytics</li>
              <li><strong>Google/OpenAI:</strong> AI services for inspections and support</li>
            </ul>
            <p className="mt-4">
              We require all third parties to maintain appropriate security measures and only process 
              data according to our instructions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            
            <h3 className="text-xl font-medium mt-6 mb-3">For All Users</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Download a copy of your data</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">GDPR Rights (EU Users)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to data portability</li>
              <li>Right to restrict processing</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">CCPA Rights (California Residents)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Deletion Request Process</h2>
            <p>To request deletion of your data:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Log into your account and navigate to Settings &gt; Privacy</li>
              <li>Click &quot;Request Data Deletion&quot;</li>
              <li>Confirm your identity via email verification</li>
              <li>We will process your request within 30 days</li>
            </ol>
            <p className="mt-4">
              Alternatively, email <a href="mailto:privacy@rentanddrive.net" className="text-primary hover:underline">privacy@rentanddrive.net</a> with 
              your request. Note that we may retain certain data as required by law or for legitimate 
              business purposes (such as resolving disputes or enforcing agreements).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>TLS encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and employee training</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies for authentication, preferences, and analytics. 
              See our Cookie Policy for details on managing cookie preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <p>
              For privacy-related inquiries or to exercise your rights:
            </p>
            <address className="not-italic mt-4">
              <strong>Rent and Drive LLC</strong><br />
              Privacy Officer<br />
              Reno, Nevada<br />
              Email: <a href="mailto:privacy@rentanddrive.net" className="text-primary hover:underline">privacy@rentanddrive.net</a><br />
              Phone: (775) 555-0123
            </address>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated via 
              email and platform notification. The &quot;Last updated&quot; date at the top indicates when 
              this policy was last revised.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
