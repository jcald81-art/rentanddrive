import { Suspense } from 'react'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { VehicleFilters } from '@/components/vehicles/vehicle-filters'
import { SortSelect } from '@/components/vehicles/sort-select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import type { Vehicle } from '@/lib/types/vehicle'
import { createClient } from '@/lib/supabase/server'
import { SAMPLE_VEHICLES, filterVehicles } from '@/lib/data/sample-vehicles'

export const metadata = {
  title: 'Browse Vehicles | Rent and Drive',
  description: 'Find your perfect rental vehicle. Save 10% vs Turo when you book direct.',
}

interface SearchParams {
  mode?: string
  category?: string
  start_date?: string
  end_date?: string
  awd?: string
  ski_rack?: string
  tow_hitch?: string
  pet_friendly?: string
  min_rate?: string
  max_rate?: string
  min_seats?: string
  sort?: string
  location?: string
}

async function getVehicles(searchParams: SearchParams): Promise<Vehicle[]> {
  // Try database first
  try {
    const supabase = await createClient()
    let query = supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .eq('is_active', true)
      .eq('is_approved', true)

    // Location filter
    if (searchParams.location) {
      const locationMap: Record<string, string> = {
        'reno': 'Reno',
        'sparks': 'Sparks',
        'tahoe': 'Lake Tahoe',
        'north-tahoe': 'North Lake Tahoe',
        'south-tahoe': 'South Lake Tahoe',
      }
      const city = locationMap[searchParams.location.toLowerCase()] || searchParams.location
      query = query.ilike('location_city', `%${city}%`)
    }

    if (searchParams.category && searchParams.category !== 'all') {
      query = query.eq('category', searchParams.category)
    }
    if (searchParams.awd === 'true') {
      query = query.eq('is_awd', true)
    }
    if (searchParams.ski_rack === 'true') {
      query = query.eq('has_ski_rack', true)
    }
    if (searchParams.tow_hitch === 'true') {
      query = query.eq('has_tow_hitch', true)
    }
    if (searchParams.min_rate) {
      query = query.gte('daily_rate', parseFloat(searchParams.min_rate))
    }
    if (searchParams.max_rate) {
      query = query.lte('daily_rate', parseFloat(searchParams.max_rate))
    }
    if (searchParams.min_seats) {
      query = query.gte('seats', parseInt(searchParams.min_seats))
    }

    // Apply sorting
    const sortOption = searchParams.sort || 'price_asc'
    switch (sortOption) {
      case 'price_desc':
        query = query.order('daily_rate', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false, nullsFirst: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('daily_rate', { ascending: true })
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      // Map database fields to Vehicle type
      return data.map((v) => ({
        ...v,
        images: v.photos || [],
        features: v.features || [],
        location: v.location_city || 'Reno',
      }))
    }
  } catch (err) {
    console.error('[v0] Error fetching vehicles:', err)
  }

  // Return filtered sample data as fallback
  return filterVehicles(SAMPLE_VEHICLES, searchParams)
}

function VehicleGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border">
          <Skeleton className="aspect-[4/3]" />
          <div className="p-3">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-2 h-3 w-1/2" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function VehicleGrid({ searchParams }: { searchParams: SearchParams }) {
  const vehicles = await getVehicles(searchParams)

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16 text-center">
        <div className="mb-4 text-4xl">🚗</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No vehicles found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check back later for new listings.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const isRentMode = params.mode !== 'buy'

  return (
  <main className="min-h-screen bg-background">
      
      {/* Compact Header */}
      <div className="bg-primary px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-primary-foreground">
            {isRentMode ? 'Rent a Vehicle' : 'Buy a Vehicle'}
          </h1>
          <p className="text-sm text-primary-foreground/80">
            {isRentMode 
              ? 'Save 10% vs Turo — book direct with local Reno support'
              : 'Quality pre-owned vehicles from trusted local sellers'
            }
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Compact Filter Bar */}
        <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
          <VehicleFilters />
        </Suspense>

        {/* Results Header */}
        <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {params.location && `${params.location.charAt(0).toUpperCase() + params.location.slice(1)}`}
            </span>
            {/* Active Filter Badges */}
            {params.category && params.category !== 'all' && (
              <Badge variant="secondary" className="capitalize text-xs">
                {params.category}
              </Badge>
            )}
            {params.awd === 'true' && (
              <Badge variant="secondary" className="text-xs">AWD</Badge>
            )}
            {params.ski_rack === 'true' && (
              <Badge variant="secondary" className="text-xs">Ski Rack</Badge>
            )}
            {params.tow_hitch === 'true' && (
              <Badge variant="secondary" className="text-xs">Tow Hitch</Badge>
            )}
          </div>
          <SortSelect defaultValue={params.sort || 'price_asc'} />
        </div>

        {/* Vehicle Grid */}
        <Suspense fallback={<VehicleGridSkeleton />}>
          <VehicleGrid searchParams={params} />
        </Suspense>
      </div>
    </main>
  )
}
