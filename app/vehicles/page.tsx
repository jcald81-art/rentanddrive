import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { VehicleFilters } from '@/components/vehicles/vehicle-filters'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Vehicle } from '@/lib/types/vehicle'

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
  min_rate?: string
  max_rate?: string
}

async function getVehicles(searchParams: SearchParams): Promise<Vehicle[]> {
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

  if (searchParams.min_rate) {
    query = query.gte('daily_rate', parseFloat(searchParams.min_rate))
  }

  if (searchParams.max_rate) {
    query = query.lte('daily_rate', parseFloat(searchParams.max_rate))
  }

  if (searchParams.start_date && searchParams.end_date) {
    query = query
      .lte('available_from', searchParams.start_date)
      .gte('available_to', searchParams.end_date)
  }

  const { data, error } = await query.order('daily_rate', { ascending: true })

  if (error) {
    console.error('Error fetching vehicles:', error)
    return []
  }

  return data || []
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
      {/* Value Prop Banner */}
      <div className="bg-primary px-4 py-3 text-center">
        <p className="text-sm font-medium text-primary-foreground">
          Book direct and save 10% vs Turo — no hidden fees, local support
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Browse Vehicles
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find the perfect ride for your next adventure in Reno and beyond
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Filters Sidebar */}
          <Suspense fallback={<Skeleton className="h-96 w-full lg:w-72" />}>
            <VehicleFilters />
          </Suspense>

          {/* Vehicle Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(params.category || params.awd || params.ski_rack) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
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
              </div>
            )}

            <Suspense fallback={<VehicleGridSkeleton />}>
              <VehicleGrid searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
