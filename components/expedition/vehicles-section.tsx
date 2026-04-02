import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FeaturedVehicles } from '@/components/featured-vehicles'
import { ArrowRight } from 'lucide-react'

export function VehiclesSection() {
  return (
    <section className="bg-[#F5F3EF] py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mb-12 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-3xl font-bold text-[#0D0D0D] md:text-4xl">
              Featured Vehicles
            </h2>
            <p className="mt-2 text-muted-foreground">
              Top-rated rides ready for your next adventure
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/vehicles">
              View All Vehicles <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Featured Vehicles Grid */}
        <FeaturedVehicles />

        {/* Category Quick Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            { label: 'AWD/4WD', href: '/vehicles?awd=true' },
            { label: 'SUVs', href: '/vehicles?category=suv' },
            { label: 'Trucks', href: '/vehicles?category=truck' },
            { label: 'Luxury', href: '/vehicles?category=luxury' },
            { label: 'Economy', href: '/vehicles?category=economy' },
            { label: 'RVs', href: '/vehicles?category=rv' },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="rounded-full border border-[#0D0D0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0D0D0D] transition-colors hover:border-[#CC0000] hover:text-[#CC0000]"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
