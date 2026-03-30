'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function InsuranceDisclosurePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-10 w-10 text-[#CC0000]" />
          <h1 className="text-4xl font-bold">Insurance Disclosure</h1>
        </div>
        <p className="text-muted-foreground mb-8">Understanding your coverage with Rent and Drive</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Tint Insurance Partnership
            </h2>
            <p className="text-sm mb-0">
              All rentals through Rent and Drive include insurance coverage provided by our partner, 
              Tint Insurance. Tint specializes in embedded insurance for mobility platforms and is 
              licensed in all 50 states. Policy underwriting is provided by A-rated carriers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">The Three Coverage Periods</h2>
            <p>
              Insurance coverage changes throughout the rental lifecycle. Here&apos;s what applies during each period:
            </p>

            <div className="grid gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Period 1: Vehicle Listed, Not Booked</CardTitle>
                    <Badge variant="outline">Host&apos;s Personal Insurance</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    When your vehicle is listed but not actively rented, your personal auto insurance 
                    remains the primary coverage. We recommend notifying your personal insurer that you 
                    participate in peer-to-peer car sharing.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#CC0000]/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Period 2: Active Rental</CardTitle>
                    <Badge className="bg-[#CC0000]">Tint Coverage Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    From the moment a rental begins (trip start) until it ends (trip complete), 
                    Tint&apos;s commercial insurance is primary. This includes:
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>$1,000,000 liability coverage</strong> - Bodily injury and property damage to third parties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Comprehensive coverage</strong> - Theft, vandalism, weather damage, fire</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span><strong>Collision coverage</strong> - Damage from accidents regardless of fault</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Period 3: Post-Rental Return</CardTitle>
                    <Badge variant="outline">Host&apos;s Personal Insurance</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    After the rental ends and the vehicle is returned, coverage reverts to the Host&apos;s 
                    personal auto insurance. Any damage discovered during post-trip inspection that 
                    occurred during the rental is still covered under Period 2.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What IS Covered</h2>
            <ul className="list-none space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Collision damage to the rental vehicle</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Theft of the vehicle during the rental period</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Third-party bodily injury and property damage</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Weather-related damage (hail, flooding, falling objects)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Vandalism during the rental</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Fire damage</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span>Windshield and glass damage</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What is NOT Covered</h2>
            <ul className="list-none space-y-3">
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Damage resulting from prohibited uses (racing, off-road, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Damage caused by unlicensed or unauthorized drivers</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Intentional damage or fraud</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Personal belongings left in the vehicle</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Mechanical breakdown or wear and tear</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Tire damage (unless part of a covered collision)</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Interior damage from smoking, pets, or spills</span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <span>Damage occurring outside the rental period</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Deductibles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Standard Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-[#CC0000]">$2,500</p>
                  <p className="text-sm text-muted-foreground">Included with every rental</p>
                </CardContent>
              </Card>
              <Card className="border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Premium Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">$500</p>
                  <p className="text-sm text-muted-foreground">+$15/day at checkout</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How to File a Claim</h2>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong>Document the incident:</strong> Take photos and videos of all damage immediately. 
                Complete the post-trip Cartegrity inspection.
              </li>
              <li>
                <strong>Report within 24 hours:</strong> Contact our support team or file through the app. 
                For accidents involving injuries, also file a police report.
              </li>
              <li>
                <strong>Provide information:</strong> Date, time, location, description of incident, 
                other parties involved, and all documentation.
              </li>
              <li>
                <strong>Claim review:</strong> Our claims team will review within 48 hours and connect 
                you with Tint&apos;s adjusters if needed.
              </li>
              <li>
                <strong>Resolution:</strong> Most claims are resolved within 14-30 days depending on complexity.
              </li>
            </ol>
            <p className="mt-4">
              <strong>Emergency Claims Line:</strong> (775) 555-HELP (4357) - Available 24/7
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">State Minimum Requirements</h2>
            <p className="mb-4">
              Our coverage meets or exceeds state minimum requirements in all operating states. 
              Here are the minimums for common states:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">State</th>
                    <th className="text-left py-2 pr-4">Liability (BI/PD)</th>
                    <th className="text-left py-2">Our Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">Nevada</td>
                    <td className="py-2 pr-4">25/50/20</td>
                    <td className="py-2 text-green-600">$1M Combined</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">California</td>
                    <td className="py-2 pr-4">15/30/5</td>
                    <td className="py-2 text-green-600">$1M Combined</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">Arizona</td>
                    <td className="py-2 pr-4">25/50/15</td>
                    <td className="py-2 text-green-600">$1M Combined</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-medium">Utah</td>
                    <td className="py-2 pr-4">25/65/15</td>
                    <td className="py-2 text-green-600">$1M Combined</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium">Oregon</td>
                    <td className="py-2 pr-4">25/50/20</td>
                    <td className="py-2 text-green-600">$1M Combined</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Questions About Coverage?</h2>
            <p className="text-sm mb-4">
              Our support team is available to explain coverage details and help with claims.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/faq">Read FAQ</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
