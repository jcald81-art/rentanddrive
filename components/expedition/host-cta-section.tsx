'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function HostCTASection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
    })
  }, [])

  const listVehicleHref = isAuthenticated ? '/list-vehicle' : '/sign-in?redirectTo=/list-vehicle'

  return (
    <section className="bg-card py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl text-foreground leading-tight mb-6">
              Your vehicle.<br />
              Working for you.
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              List on Rent and Drive and keep 90% of every booking. 
              RAD Fleet tracks your vehicle. igloohome handles the keys. 
              You collect the revenue.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium px-8 py-6 rounded-full text-lg"
              >
                <Link href={listVehicleHref}>
                  Become a founding host
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Link
                href="/how-it-works"
                className="inline-flex items-center text-foreground font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Revenue Comparison */}
          <div className="bg-muted rounded-2xl p-8 lg:p-10">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-8">
              Monthly Earnings Comparison
            </h3>

            {/* RAD */}
            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-foreground font-medium">Rent and Drive</span>
                <span className="font-serif text-3xl text-primary">$1,620</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div className="h-full w-[90%] bg-primary rounded-full" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You keep 90% of $1,800 gross
              </p>
            </div>

            {/* Turo */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-foreground font-medium">Turo</span>
                <span className="font-serif text-3xl text-muted-foreground">$1,170</span>
              </div>
              <div className="h-3 bg-border rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-muted-foreground rounded-full" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You keep 65% of $1,800 gross
              </p>
            </div>

            {/* Difference */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Annual difference</span>
                <span className="font-serif text-2xl text-accent">+$5,400/yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
