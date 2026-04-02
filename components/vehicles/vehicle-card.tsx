'use client'

import Link from 'next/link'
import { Star, Zap, Mountain, ShieldCheck, Tag, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vehicle } from '@/lib/types/vehicle'

interface VehicleCardProps {
  vehicle: Vehicle & { 
    has_vin_report?: boolean
    sell_while_renting?: boolean
    for_sale?: boolean
    inspektlabs_certified?: boolean
    eagle_eye_tracked?: boolean
    photos?: string[]
  }
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="group overflow-hidden border-0 p-0 shadow-md transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={vehicle.thumbnail || vehicle.photos?.[0] || '/placeholder-car.jpg'}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {vehicle.instant_book && (
              <Badge className="bg-[#CC0000] text-white gap-1">
                <Zap className="size-3" />
                Instant Book
              </Badge>
            )}
            {vehicle.is_awd && (
              <Badge variant="secondary" className="bg-foreground/80 text-background gap-1">
                <Mountain className="size-3" />
                AWD
              </Badge>
            )}
            {vehicle.inspektlabs_certified && (
              <Badge variant="secondary" className="bg-green-600 text-white gap-1">
                <ShieldCheck className="size-3" />
                Certified
              </Badge>
            )}
            {vehicle.eagle_eye_tracked && (
              <Badge variant="secondary" className="bg-blue-600 text-white gap-1">
                <Eye className="size-3" />
                Tracked
              </Badge>
            )}
          </div>
          {/* For Sale Tag - subtle red tag icon */}
          {(vehicle.sell_while_renting || vehicle.for_sale) && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-[#CC0000]/90 text-white gap-1">
                <Tag className="size-3" />
                For Sale
              </Badge>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.location_city}, {vehicle.location_state}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="size-4 fill-primary text-primary" />
              <span className="font-medium">{vehicle.rating?.toFixed(1) || 'New'}</span>
              {vehicle.trip_count > 0 && (
                <span className="text-muted-foreground">({vehicle.trip_count} trips)</span>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1 pt-1">
            <span className="text-lg font-bold text-foreground">
              ${vehicle.daily_rate}
            </span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
