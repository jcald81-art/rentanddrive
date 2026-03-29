import { Suspense } from 'react'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { VehicleFilters } from '@/components/vehicles/vehicle-filters'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Vehicle } from '@/lib/types/vehicle'
import { headers } from 'next/headers'

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
  // Build query string from search params
  const params = new URLSearchParams()
  if (searchParams.category) params.set('category', searchParams.category)
  if (searchParams.awd) params.set('awd', searchParams.awd)
  if (searchParams.ski_rack) params.set('ski_rack', searchParams.ski_rack)
  if (searchParams.min_rate) params.set('min_rate', searchParams.min_rate)
  if (searchParams.max_rate) params.set('max_rate', searchParams.max_rate)
  if (searchParams.start_date) params.set('start_date', searchParams.start_date)
  if (searchParams.end_date) params.set('end_date', searchParams.end_date)

  // Get the host from headers for absolute URL
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  
  try {
    const res = await fetch(`${protocol}://${host}/api/vehicles?${params.toString()}`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      console.error('API error:', res.status)
      return []
    }
    
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch vehicles:', error)
    return []
  }
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
