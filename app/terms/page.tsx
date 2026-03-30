'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 29, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Platform Description</h2>
            <p>
              Rent and Drive LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates a peer-to-peer 
              car rental platform connecting vehicle owners (&quot;Hosts&quot;) with individuals seeking temporary 
              vehicle access (&quot;Renters&quot;). Our platform, accessible at rentanddrive.net and through our 
              mobile applications, facilitates vehicle listings, bookings, payments, and related services.
            </p>
            <p>
              By accessing or using our platform, you agree to be bound by these Terms of Service. If you 
              do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Host Responsibilities</h2>
            <p>As a Host on our platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information about your vehicle, including make, model, year, mileage, and condition</li>
              <li>Maintain valid vehicle registration, insurance, and any required inspections</li>
              <li>Ensure your vehicle is safe, clean, and roadworthy for each rental</li>
              <li>Complete pre-trip and post-trip carfidelity.ai inspections as required</li>
              <li>Install and maintain an active Bouncie GPS device (Eagle System) on all listed vehicles</li>
              <li>Respond to booking requests within 24 hours</li>
              <li>Disclose any known mechanical issues or limitations</li>
              <li>Comply with all applicable local, state, and federal laws</li>
              <li>Maintain the vehicle in accordance with manufacturer recommendations</li>
              <li>Report any accidents, damage, or incidents within 24 hours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Renter Responsibilities</h2>
            <p>As a Renter on our platform, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide a valid driver&apos;s license and meet minimum age requirements (21 years for standard vehicles, 25 years for luxury/specialty vehicles)</li>
              <li>Maintain a clean driving record with no major violations in the past 3 years</li>
              <li>Complete pre-trip and post-trip carfidelity.ai inspections honestly and accurately</li>
              <li>Return the vehicle on time, in the same condition as received</li>
              <li>Report any accidents, damage, or mechanical issues immediately</li>
              <li>Not smoke, vape, or allow pets in vehicles unless explicitly permitted</li>
              <li>Not use vehicles for illegal purposes, racing, or commercial activities without authorization</li>
              <li>Observe all traffic laws and GPS-monitored speed limits</li>
              <li>Return the vehicle with the same fuel level as received</li>
              <li>Not exceed geographic boundaries set by the Host</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. carfidelity.ai Inspection Requirement</h2>
            <p>
              All rentals require completion of our carfidelity.ai inspection process (powered by Inspector Cartegrity AI). 
              Both Hosts and Renters must complete photographic inspections at the start and end of each rental period. 
              These inspections document the vehicle&apos;s condition and are used to resolve any damage disputes.
            </p>
            <p>
              Failure to complete inspections may result in assumption of liability for any undocumented 
              damage. Inspection photos are retained for 90 days following the rental period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Eagle GPS Monitoring Disclosure</h2>
            <p>
              All vehicles on our platform are equipped with Bouncie GPS devices as part of our Eagle 
              Fleet Monitoring System. By using our platform, you acknowledge and consent to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Real-time location tracking during rental periods</li>
              <li>Recording of speed, acceleration, and braking data</li>
              <li>Geofencing alerts when vehicles leave designated areas</li>
              <li>Trip history logging for safety and billing purposes</li>
              <li>Data retention for up to 90 days following each rental</li>
            </ul>
            <p>
              This monitoring is conducted for safety, security, and platform integrity purposes. Data is 
              handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Insurance Coverage</h2>
            <p>
              All rentals through our platform include insurance coverage provided through our partnership 
              with Tint Insurance. Coverage includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>$1,000,000 liability coverage</li>
              <li>Comprehensive and collision coverage with applicable deductibles</li>
              <li>Coverage for the Host&apos;s vehicle during the rental period</li>
            </ul>
            <p>
              Additional coverage options may be available at checkout. See our Insurance Disclosure page 
              for complete details on coverage terms, exclusions, and limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
            <p>
              All payments are processed through Stripe. Hosts receive payment within 3 business days 
              following the completion of each rental. Our platform fee is 10% for Hosts and varies for 
              Renters based on the booking amount.
            </p>
            <p>
              Security deposits may be held and are fully refundable within 72 hours of rental completion, 
              provided no damage claims are filed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Security Deposit Policy</h2>
            <p>
              Hosts may require security deposits ranging from $200 to $2,500 depending on vehicle value. 
              Deposits are:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pre-authorized (not charged) at booking</li>
              <li>Released within 72 hours of successful rental completion</li>
              <li>May be partially or fully captured in case of documented damage</li>
              <li>Subject to dispute resolution if contested</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cancellation Policy</h2>
            <p>Cancellation fees are structured as follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Free cancellation:</strong> More than 72 hours before trip start</li>
              <li><strong>50% refund:</strong> 24-72 hours before trip start</li>
              <li><strong>No refund:</strong> Less than 24 hours before trip start</li>
            </ul>
            <p>
              Host cancellations may result in penalties including reduced search visibility, temporary 
              suspension, or account termination for repeated occurrences.
            </p>
          </section>

          <section className="border-l-4 border-[#CC0000] pl-4 bg-red-50 dark:bg-red-950/20 p-4 rounded-r">
            <h2 className="text-2xl font-semibold mb-4 text-[#CC0000]">10. Black Rock Desert / Burning Man Prohibition</h2>
            <p className="font-semibold mb-4">
              VEHICLES ARE STRICTLY PROHIBITED FROM THE BLACK ROCK DESERT PLAYA AND BURNING MAN EVENT.
            </p>
            <p className="mb-4">
              All vehicles listed on the Rent and Drive platform are GPS-monitored via our Eagle System. 
              Entry into the Black Rock Desert area (coordinates: 40.7864°N, 119.2065°W, 15-mile radius) 
              will trigger an immediate critical alert.
            </p>
            <p className="font-semibold">
              Violation consequences include:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Immediate and full security deposit forfeiture</strong></li>
              <li>Additional damage restoration fees assessed at actual cost</li>
              <li>Permanent ban from the Rent and Drive platform</li>
              <li>Potential legal action for breach of contract</li>
            </ul>
            <p className="text-sm">
              No &quot;Playa Package&quot; or special permission is available. This prohibition is absolute and 
              without exception. The extreme conditions of the Black Rock Desert environment cause 
              significant damage to vehicles including alkaline dust infiltration, brake damage, and 
              corrosion that is expensive and time-consuming to remediate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Other Prohibited Uses</h2>
            <p>Vehicles may not be used for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any illegal activity</li>
              <li>Racing, stunts, or reckless driving</li>
              <li>Towing or pushing other vehicles</li>
              <li>Commercial purposes without prior authorization</li>
              <li>Rideshare or delivery services</li>
              <li>Off-road driving unless the vehicle is specifically listed for such use</li>
              <li>Transporting hazardous materials</li>
              <li>Driving under the influence of alcohol or drugs</li>
              <li>Allowing unlicensed or unauthorized drivers to operate the vehicle</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
            <p>
              Disputes between Hosts and Renters will first be mediated by our support team. If resolution 
              cannot be reached, disputes will be submitted to binding arbitration in accordance with the 
              rules of the American Arbitration Association.
            </p>
            <p>
              You agree to waive any right to participate in class action lawsuits against Rent and Drive LLC.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Rent and Drive LLC shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages arising from your use of 
              the platform. Our total liability shall not exceed the amount you paid to us in the 12 months 
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the 
              State of Nevada, without regard to its conflict of law provisions. Any legal action arising 
              from these terms shall be brought exclusively in the state or federal courts located in 
              Washoe County, Nevada.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material changes will be communicated 
              via email and platform notification at least 30 days before taking effect. Continued use of 
              the platform after changes constitute acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <address className="not-italic mt-4">
              <strong>Rent and Drive LLC</strong><br />
              Reno, Nevada<br />
              Email: <a href="mailto:legal@rentanddrive.net" className="text-primary hover:underline">legal@rentanddrive.net</a><br />
              Phone: (775) 555-0123
            </address>
          </section>
        </div>
      </div>
    </div>
  )
}
