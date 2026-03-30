'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Radar, Bot, MapPin, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" asChild className="mb-8 text-white hover:text-white/80">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-[#CC0000]">Rent and Drive</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Making peer-to-peer car rental accessible, safe, and transparent for the 
            Reno-Tahoe region and beyond.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          {/* Our Story */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-lg text-muted-foreground">
              Rent and Drive was founded in 2026 in Reno, Nevada with a simple observation: 
              peer-to-peer car sharing was broken. Hosts worried about damage to their vehicles, 
              renters struggled with unclear policies, and everyone paid too much in fees to 
              platforms that provided too little value.
            </p>
            <p className="text-lg text-muted-foreground">
              We set out to build something different. A platform where technology actually solves 
              problems instead of creating them. Where hosts and renters are treated as partners, 
              not customers to be squeezed. Where safety and transparency aren&apos;t marketing 
              buzzwords but engineering priorities.
            </p>
            <p className="text-lg text-muted-foreground">
              Starting in the unique Reno-Tahoe market&mdash;where renters need AWD vehicles for ski trips 
              and hosts want protection from mountain road adventures&mdash;gave us the perfect testing 
              ground for our vision.
            </p>
          </section>

          {/* Mission */}
          <section className="bg-[#CC0000]/5 p-8 rounded-2xl border border-[#CC0000]/10">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-[#CC0000]" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-lg mb-0">
              To make peer-to-peer car rental <strong>accessible</strong> to everyone, 
              <strong> safe</strong> through technology, and <strong>transparent</strong> in 
              every interaction. We believe vehicle owners deserve to earn from their assets, 
              and renters deserve fair prices with clear terms.
            </p>
          </section>

          {/* Technology */}
          <section>
            <h2 className="text-3xl font-bold mb-6">The Technology</h2>
            <p className="text-muted-foreground mb-8">
              We didn&apos;t just build an app. We built an integrated system that makes 
              peer-to-peer rentals actually work.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-blue-500/30">
                <CardContent className="pt-6">
                  <Radar className="h-10 w-10 text-blue-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Eagle Fleet Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time GPS tracking with Bouncie devices on every vehicle. Geofencing, 
                    trip logging, driving behavior analysis, and instant alerts keep everyone safe.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-500/30">
                <CardContent className="pt-6">
                  <Shield className="h-10 w-10 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Cartegrity Inspections</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered photo inspections document vehicle condition before and after 
                    every trip. No more he-said-she-said disputes about damage.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30">
                <CardContent className="pt-6">
                  <Bot className="h-10 w-10 text-purple-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">R&D Agent System</h3>
                  <p className="text-sm text-muted-foreground">
                    Six AI agents work 24/7: SecureLink for communications, Dollar for pricing, 
                    Shield for reputation, and more. Intelligence that actually helps.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-3xl font-bold mb-6">What We Stand For</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                  <span className="text-[#CC0000] font-bold">10%</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Fair Fees</h3>
                  <p className="text-muted-foreground">
                    We charge hosts 10%, not 35%. More money in your pocket means a healthier 
                    ecosystem for everyone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#CC0000]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Real Protection</h3>
                  <p className="text-muted-foreground">
                    $1M liability coverage through Tint Insurance, GPS monitoring, and documented 
                    inspections. Not just promises, but systems that work.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-[#CC0000]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Local First</h3>
                  <p className="text-muted-foreground">
                    We&apos;re based in Reno and built for the Reno-Tahoe market. We understand 
                    ski trips, mountain roads, and what it takes to rent here.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#CC0000]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Community Driven</h3>
                  <p className="text-muted-foreground">
                    Hosts Suite and Renters Suite create engaged communities. We gamify the 
                    experience because rentals should be rewarding for everyone.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team */}
          <section>
            <h2 className="text-3xl font-bold mb-6">The Team</h2>
            <p className="text-muted-foreground mb-8">
              We&apos;re a small team of engineers, designers, and car enthusiasts based in 
              Reno, Nevada. More team member profiles coming soon.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
                  <h3 className="font-semibold">Founder</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
                  <h3 className="font-semibold">Engineering</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4" />
                  <h3 className="font-semibold">Operations</h3>
                  <p className="text-sm text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Location */}
          <section className="bg-muted p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6 text-[#CC0000]" />
              <h2 className="text-2xl font-bold">Nevada Based</h2>
            </div>
            <p className="mb-4">
              Rent and Drive LLC is proudly headquartered in Reno, Nevada. We chose Reno for 
              its proximity to Lake Tahoe, its growing tech scene, and its welcoming business 
              environment.
            </p>
            <p className="text-sm text-muted-foreground">
              Founded 2026 | Reno, Nevada
            </p>
          </section>

          {/* CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join the Rent and Drive community today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/vehicles">Browse Vehicles</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/signup?role=host">Become a Host</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
