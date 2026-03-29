'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Zap, Mountain } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Vehicle } from '@/lib/types/vehicle'

interface VehicleCardProps {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="group overflow-hidden border-0 p-0 shadow-md transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={vehicle.thumbnail_url || '/placeholder-car.jpg'}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {vehicle.instant_book && (
              <Badge className="bg-primary text-primary-foreground gap-1">
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
          </div>
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
              {vehicle.review_count > 0 && (
                <span className="text-muted-foreground">({vehicle.review_count})</span>
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
