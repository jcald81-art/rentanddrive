import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Zap, Mountain } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface FeaturedVehicle {
  id: string
  make: string
  model: string
  year: number
  daily_rate: number
  thumbnail_url: string
  location_city: string
  rating: number
  trip_count: number
  instant_book: boolean
  is_awd: boolean
}

export async function FeaturedVehicles() {
  const supabase = await createClient()
  
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      daily_rate,
      thumbnail_url,
      location_city,
      rating,
      trip_count,
      instant_book,
      is_awd
    `)
    .eq('is_available', true)
    .eq('is_approved', true)
    .not('rating', 'is', null)
    .order('rating', { ascending: false })
    .order('trip_count', { ascending: false })
    .limit(4)

  if (error || !vehicles || vehicles.length === 0) {
    // Fallback to sample data if no vehicles in database
    return <FeaturedVehiclesFallback />
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {vehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
          <Card className="group overflow-hidden border-0 shadow-md transition-all hover:shadow-lg">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={vehicle.thumbnail_url || '/placeholder-car.jpg'}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {vehicle.instant_book && (
                  <Badge className="bg-[#CC0000] text-white gap-1">
                    <Zap className="h-3 w-3" />
                    Instant
                  </Badge>
                )}
                {vehicle.is_awd && (
                  <Badge variant="secondary" className="bg-foreground/80 text-background gap-1">
                    <Mountain className="h-3 w-3" />
                    AWD
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {vehicle.location_city}
                  </div>
                </div>
                {vehicle.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-[#CC0000] text-[#CC0000]" />
                    <span className="font-medium">{vehicle.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({vehicle.trip_count})</span>
                  </div>
                )}
              </div>
              <p className="font-semibold text-[#CC0000]">
                ${vehicle.daily_rate}/day
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// Fallback with sample vehicles when database is empty
function FeaturedVehiclesFallback() {
  const sampleVehicles = [
    {
      id: '1',
      year: 2023,
      make: 'Toyota',
      model: '4Runner TRD',
      daily_rate: 95,
      thumbnail_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80',
      location_city: 'Reno',
      rating: 4.9,
      trip_count: 47,
      instant_book: true,
      is_awd: true,
    },
    {
      id: '2',
      year: 2022,
      make: 'Jeep',
      model: 'Wrangler Rubicon',
      daily_rate: 125,
      thumbnail_url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&auto=format&fit=crop&q=80',
      location_city: 'Reno',
      rating: 4.8,
      trip_count: 32,
      instant_book: true,
      is_awd: true,
    },
    {
      id: '3',
      year: 2023,
      make: 'Subaru',
      model: 'Outback',
      daily_rate: 75,
      thumbnail_url: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&auto=format&fit=crop&q=80',
      location_city: 'Sparks',
      rating: 4.9,
      trip_count: 65,
      instant_book: false,
      is_awd: true,
    },
    {
      id: '4',
      year: 2021,
      make: 'Tesla',
      model: 'Model Y',
      daily_rate: 110,
      thumbnail_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&auto=format&fit=crop&q=80',
      location_city: 'Reno',
      rating: 4.7,
      trip_count: 28,
      instant_book: true,
      is_awd: true,
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {sampleVehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicles`}>
          <Card className="group overflow-hidden border-0 shadow-md transition-all hover:shadow-lg">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={vehicle.thumbnail_url}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {vehicle.instant_book && (
                  <Badge className="bg-[#CC0000] text-white gap-1">
                    <Zap className="h-3 w-3" />
                    Instant
                  </Badge>
                )}
                {vehicle.is_awd && (
                  <Badge variant="secondary" className="bg-foreground/80 text-background gap-1">
                    <Mountain className="h-3 w-3" />
                    AWD
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {vehicle.location_city}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-[#CC0000] text-[#CC0000]" />
                  <span className="font-medium">{vehicle.rating}</span>
                  <span className="text-muted-foreground">({vehicle.trip_count})</span>
                </div>
              </div>
              <p className="font-semibold text-[#CC0000]">
                ${vehicle.daily_rate}/day
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
