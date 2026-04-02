import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Car, DollarSign, Shield, ArrowRight } from 'lucide-react'

export function HostCTASection() {
  return (
    <section className="bg-emerald-900 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <Car className="h-4 w-4 text-white" />
              <span className="text-sm text-white">Become a Host</span>
            </div>
            
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Turn Your Car Into a Money Maker
            </h2>
            
            <p className="mb-8 text-lg text-white/70">
              List your vehicle on Rent and Drive and earn up to $1,500/month. 
              We handle insurance, payments, and support - you just share your car.
            </p>

            {/* Benefits */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: DollarSign, text: 'Keep 85% of earnings' },
                { icon: Shield, text: '$1M liability coverage' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-white">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2 bg-white text-emerald-900 hover:bg-white/90">
                <Link href="/host/register">
                  Start Hosting <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 border-white/30 text-white hover:bg-white/10">
                <Link href="/host">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>

          {/* Image/Stats */}
          <div className="relative">
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
              <div className="mb-6 text-center">
                <div className="text-5xl font-bold text-white">$1,200</div>
                <div className="mt-2 text-white/70">Average monthly earnings</div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">500+</div>
                  <div className="text-xs text-white/60">Active Hosts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">98%</div>
                  <div className="text-xs text-white/60">Satisfaction</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400">24hr</div>
                  <div className="text-xs text-white/60">Payout Speed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
