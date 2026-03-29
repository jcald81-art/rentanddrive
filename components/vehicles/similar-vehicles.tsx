'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Star, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Vehicle } from '@/lib/types/vehicle'

interface SimilarVehiclesProps {
  currentVehicleId: string
  category: string
  locationCity: string
}

export function SimilarVehicles({ currentVehicleId, category, locationCity }: SimilarVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      const supabase = createClient()

      // Fetch similar vehicles: same category or same city, excluding current
      const { data, error } = await supabase
        .from('active_listings')
        .select('*')
        .neq('id', currentVehicleId)
        .or(`category.eq.${category},location_city.eq.${locationCity}`)
        .limit(4)

      if (!error && data) {
        setVehicles(data)
      }

      setLoading(false)
    }

    fetchSimilar()
  }, [currentVehicleId, category, locationCity])

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="mb-6 text-xl font-semibold">Similar Vehicles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className="aspect-[4/3]" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (vehicles.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="mb-6 text-xl font-semibold">Similar Vehicles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((vehicle) => (
          <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
            <Card className="group overflow-hidden border-0 p-0 shadow-md transition-all hover:shadow-lg">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={vehicle.thumbnail || '/placeholder-car.jpg'}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {vehicle.instant_book && (
                  <Badge className="absolute left-2 top-2 bg-[#CC0000] text-white gap-1">
                    <Zap className="size-3" />
                    Instant
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold">${vehicle.daily_rate}<span className="text-xs font-normal text-muted-foreground">/day</span></span>
                  {vehicle.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3 w-3 fill-[#CC0000] text-[#CC0000]" />
                      <span>{vehicle.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
