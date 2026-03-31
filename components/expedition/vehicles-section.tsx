'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { VehicleCard } from './vehicle-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'all', label: 'All Vehicles' },
  { value: 'awd', label: 'AWD Only' },
  { value: 'suv', label: 'SUVs' },
  { value: 'truck', label: 'Trucks' },
  { value: 'luxury', label: 'Luxury' },
]

const SAMPLE_VEHICLES = [
  {
    id: '1',
    name: '2024 Subaru Outback Wilderness',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
    price: 89,
    specs: ['AWD', '5 seats', 'Thule rack'],
  },
  {
    id: '2',
    name: '2024 Toyota 4Runner TRD Pro',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    price: 129,
    specs: ['4WD', '5 seats', 'Off-road ready'],
  },
  {
    id: '3',
    name: '2024 Ford F-150 Tremor',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
    price: 149,
    specs: ['4WD', 'Crew cab', 'Tow package'],
  },
  {
    id: '4',
    name: '2024 Jeep Wrangler Rubicon',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    price: 119,
    specs: ['4WD', '4 seats', 'Removable top'],
  },
  {
    id: '5',
    name: '2024 Rivian R1S',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80',
    price: 199,
    specs: ['AWD', 'Electric', '300mi range'],
  },
  {
    id: '6',
    name: '2024 Land Rover Defender 110',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    price: 179,
    specs: ['AWD', '7 seats', 'Luxury'],
  },
]

export function VehiclesSection() {
  const [activeFilter, setActiveFilter] = useState('all')

  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <h2 className="font-serif italic text-4xl lg:text-5xl text-foreground">
            Find your vehicle
          </h2>
          <Link 
            href="/vehicles"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
          >
            View all vehicles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-medium transition-colors',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground hover:bg-muted border border-border'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Vehicle Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_VEHICLES.map((vehicle) => (
            <VehicleCard key={vehicle.id} {...vehicle} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 rounded-full"
          >
            <Link href="/vehicles">
              Browse all vehicles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
