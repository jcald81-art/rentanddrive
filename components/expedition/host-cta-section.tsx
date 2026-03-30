import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HostCTASection() {
  return (
    <section className="bg-[#2D4A2D] py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <div>
            <h2 className="font-serif text-4xl lg:text-5xl xl:text-6xl text-[#F5F2EC] leading-tight mb-6">
              Your vehicle.<br />
              Working for you.
            </h2>
            
            <p className="text-lg text-[#8BAF7C] mb-8 max-w-lg leading-relaxed">
              List on Rent and Drive and keep 90% of every booking. 
              Eagle Eye tracks your vehicle. igloohome handles the keys. 
              You collect the revenue.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="bg-[#C4813A] hover:bg-[#A66B2E] text-[#1C1F1A] font-medium px-8 py-6 rounded-full text-lg"
              >
                <Link href="/list-vehicle">
                  Become a founding host
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Link
                href="/how-it-works"
                className="inline-flex items-center text-[#F5F2EC] font-medium underline underline-offset-4 hover:text-[#8BAF7C] transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Revenue Comparison */}
          <div className="bg-[#1C1F1A] rounded-2xl p-8 lg:p-10">
            <h3 className="text-sm uppercase tracking-wider text-[#9A9589] mb-8">
              Monthly Earnings Comparison
            </h3>

            {/* RAD */}
            <div className="mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[#F5F2EC] font-medium">Rent and Drive</span>
                <span className="font-serif text-3xl text-[#8BAF7C]">$1,620</span>
              </div>
              <div className="h-3 bg-[#2D4A2D] rounded-full overflow-hidden">
                <div className="h-full w-[90%] bg-[#8BAF7C] rounded-full" />
              </div>
              <p className="text-sm text-[#9A9589] mt-2">
                You keep 90% of $1,800 gross
              </p>
            </div>

            {/* Turo */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[#F5F2EC] font-medium">Turo</span>
                <span className="font-serif text-3xl text-[#9A9589]">$1,170</span>
              </div>
              <div className="h-3 bg-[#2D4A2D] rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-[#9A9589] rounded-full" />
              </div>
              <p className="text-sm text-[#9A9589] mt-2">
                You keep 65% of $1,800 gross
              </p>
            </div>

            {/* Difference */}
            <div className="mt-8 pt-8 border-t border-[#F5F2EC]/10">
              <div className="flex items-baseline justify-between">
                <span className="text-[#9A9589]">Annual difference</span>
                <span className="font-serif text-2xl text-[#C4813A]">+$5,400/yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
