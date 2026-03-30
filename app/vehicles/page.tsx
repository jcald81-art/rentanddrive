import { Suspense } from 'react'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { VehicleFilters } from '@/components/vehicles/vehicle-filters'
import { HeroSearchBar } from '@/components/vehicles/hero-search-bar'
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
  category?: string
  start_date?: string
  end_date?: string
  awd?: string
  ski_rack?: string
  tow_hitch?: string
  min_rate?: string
  max_rate?: string
  min_seats?: string
  sort?: string
}

async function getVehicles(searchParams: SearchParams): Promise<Vehicle[]> {
  // Try database first
  try {
    const supabase = await createClient()
    let query = supabase.from('active_listings').select('*')

    if (searchParams.category) {
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
      return data
    }
  } catch {
    // Database not available, fall through to sample data
  }

  // Return filtered sample data as fallback
  return filterVehicles(SAMPLE_VEHICLES, searchParams)
}

function VehicleGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[4/3]" />
          <div className="p-4">
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
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
        <div className="mb-4 text-5xl">🚗</div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">No vehicles found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or check back later for new listings.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-[#CC0000] to-[#990000] px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find Your Perfect Rental Vehicle
          </h1>
          <p className="text-white/90 mb-8">
            Save 10% vs Turo — book direct with local Reno support
          </p>
          <Suspense fallback={<Skeleton className="h-16 w-full rounded-lg" />}>
            <HeroSearchBar />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">Home</a>
          <span>/</span>
          <span className="text-foreground">Browse Vehicles</span>
        </nav>

        {/* Main Content */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <Suspense fallback={<Skeleton className="h-96 w-full lg:w-72" />}>
            <VehicleFilters />
          </Suspense>

          {/* Vehicle Grid */}
          <div className="flex-1">
            {/* Sort and Filter Bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {(params.category || params.awd || params.ski_rack || params.tow_hitch) && (
                  <>
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {params.category && (
                      <Badge variant="secondary" className="capitalize">
                        {params.category}
                      </Badge>
                    )}
                    {params.awd === 'true' && (
                      <Badge variant="secondary">AWD</Badge>
                    )}
                    {params.ski_rack === 'true' && (
                      <Badge variant="secondary">Ski Rack</Badge>
                    )}
                    {params.tow_hitch === 'true' && (
                      <Badge variant="secondary">Tow Hitch</Badge>
                    )}
                  </>
                )}
              </div>
              <SortSelect defaultValue={params.sort || 'price_asc'} />
            </div>



            <Suspense fallback={<VehicleGridSkeleton />}>
              <VehicleGrid searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
