'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Star, 
  MapPin, 
  Zap, 
  Mountain,
  Search,
  Trash2,
  ArrowLeft,
  Car
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface WishlistVehicle {
  id: string
  vehicle: {
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
    is_available: boolean
  }
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetchWishlist()
  }, [])

  async function fetchWishlist() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        vehicle:vehicles (
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
          is_awd,
          is_available
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setWishlist(data as unknown as WishlistVehicle[])
    }
    setLoading(false)
  }

  async function removeFromWishlist(wishlistId: string) {
    setRemoving(wishlistId)
    
    const supabase = createClient()
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId)

    if (!error) {
      setWishlist(wishlist.filter(item => item.id !== wishlistId))
    }
    
    setRemoving(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Vehicles
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CC0000]">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">
              <span className="text-[#CC0000]">Rent</span>&Drive
            </span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-[#CC0000] fill-[#CC0000]" />
            Your Wishlist
          </h1>
          <p className="text-muted-foreground">
            {wishlist.length} saved vehicle{wishlist.length !== 1 ? 's' : ''}
          </p>
        </div>

        {wishlist.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No saved vehicles yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              When you find a vehicle you love, tap the heart icon to save it here for later.
            </p>
            <Button asChild className="bg-[#CC0000] hover:bg-[#CC0000]/90">
              <Link href="/vehicles">
                <Search className="mr-2 h-4 w-4" />
                Browse Vehicles
              </Link>
            </Button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((item) => (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Link href={`/vehicles/${item.vehicle.id}`}>
                    <img
                      src={item.vehicle.thumbnail_url || '/placeholder-car.jpg'}
                      alt={`${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>
                  
                  {/* Badges */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {item.vehicle.instant_book && (
                      <Badge className="bg-[#CC0000] text-white gap-1">
                        <Zap className="h-3 w-3" />
                        Instant
                      </Badge>
                    )}
                    {item.vehicle.is_awd && (
                      <Badge variant="secondary" className="bg-foreground/80 text-background gap-1">
                        <Mountain className="h-3 w-3" />
                        AWD
                      </Badge>
                    )}
                    {!item.vehicle.is_available && (
                      <Badge variant="secondary" className="bg-amber-500 text-white">
                        Unavailable
                      </Badge>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                    onClick={() => removeFromWishlist(item.id)}
                    disabled={removing === item.id}
                  >
                    {removing === item.id ? (
                      <div className="h-4 w-4 animate-spin border-2 border-[#CC0000] border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <CardContent className="p-4">
                  <Link href={`/vehicles/${item.vehicle.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">
                          {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.vehicle.location_city}
                        </div>
                      </div>
                      {item.vehicle.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-[#CC0000] text-[#CC0000]" />
                          <span className="font-medium">{item.vehicle.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({item.vehicle.trip_count})</span>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-[#CC0000]">
                      ${item.vehicle.daily_rate}/day
                    </p>
                  </Link>
                  
                  <Button 
                    asChild 
                    className="w-full mt-3 bg-[#CC0000] hover:bg-[#CC0000]/90"
                    disabled={!item.vehicle.is_available}
                  >
                    <Link href={`/book/${item.vehicle.id}`}>
                      Book Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
