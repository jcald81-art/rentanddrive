'use client'
// Renter Car Lot - Browse available vehicles
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Car, Shield, Radar, Gauge, Calendar, Search, SlidersHorizontal, 
  Tag, Snowflake, History, Star, Sparkles
} from 'lucide-react'

export default function RenterCarLotPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rentalHistory, setRentalHistory] = useState<Record<string, any>>({})
  const [filters, setFilters] = useState({
    search: '',
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch listings
        const listingsRes = await fetch('/api/car-lot/listings')
        const listingsData = await listingsRes.json()
        setListings(Array.isArray(listingsData) ? listingsData : [])

        // Fetch renter's rental history for these vehicles
        const historyRes = await fetch('/api/renter/rental-history')
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          const historyMap: Record<string, any> = {}
          historyData.forEach((booking: any) => {
            historyMap[booking.vehicle_id] = booking
          })
          setRentalHistory(historyMap)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredListings = (Array.isArray(listings) ? listings : []).filter((listing) => {
    const vehicle = listing.vehicle
    const searchTerm = filters.search.toLowerCase()
    
    if (searchTerm && !`${vehicle?.make} ${vehicle?.model}`.toLowerCase().includes(searchTerm)) {
      return false
    }
    if (filters.minPrice && listing.asking_price < parseFloat(filters.minPrice)) {
      return false
    }
    if (filters.maxPrice && listing.asking_price > parseFloat(filters.maxPrice)) {
      return false
    }
    return true
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'price_asc':
        return a.asking_price - b.asking_price
      case 'price_desc':
        return b.asking_price - a.asking_price
      case 'mileage':
        return (a.vehicle?.mileage || 0) - (b.vehicle?.mileage || 0)
      default:
        return new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Tag className="h-3 w-3 mr-1" />
              Renters Suite - Car Lot
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Rent Before You Buy
            </h1>
            <p className="text-lg text-blue-200 mb-6">
              You&apos;ve driven these cars. Now own them. Get exclusive rent-to-own discounts 
              on vehicles you&apos;ve already rented.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-blue-300" />
                <span>Rent-to-Own Discounts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-blue-300" />
                <span>See Your Rental History</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Radar className="h-4 w-4 text-blue-300" />
                <span>Eagle Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b py-4 sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search make or model..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={filters.sort} 
              onValueChange={(v) => setFilters({ ...filters, sort: v })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="mileage">Lowest Mileage</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Min $"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-[100px]"
            />
            <Input
              type="number"
              placeholder="Max $"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-[100px]"
            />
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredListings.length} vehicle{filteredListings.length !== 1 ? 's' : ''} for sale
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3 mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No vehicles found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListings.map((listing: any) => {
                const vehicle = listing.vehicle
                const hasRentalHistory = rentalHistory[vehicle?.id]
                
                return (
                  <Link key={listing.id} href={`/car-lot/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group relative">
                      {/* Previous Rental Badge */}
                      {hasRentalHistory && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs py-1 px-3 z-10 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          You&apos;ve rented this - Discount available!
                        </div>
                      )}
                      
                      <div className={`relative aspect-[4/3] ${hasRentalHistory ? 'mt-6' : ''}`}>
                        <Image
                          src={vehicle?.primary_image_url || '/placeholder-car.jpg'}
                          alt={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        {/* Eagle Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-black/80 text-white">
                            <Radar className="h-3 w-3 mr-1 text-[#CC0000]" />
                            Eagle Verified
                          </Badge>
                        </div>
                        {/* Condition */}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            className={
                              listing.condition === 'excellent' ? 'bg-green-500' :
                              listing.condition === 'good' ? 'bg-blue-500' : 'bg-yellow-500'
                            }
                          >
                            {listing.condition}
                          </Badge>
                        </div>
                        {/* Rent-to-Own Discount */}
                        {listing.rent_to_own_discount_cents > 0 && (
                          <div className="absolute bottom-2 left-2">
                            <Badge className="bg-[#CC0000]">
                              ${(listing.rent_to_own_discount_cents / 100).toLocaleString()} Rent-to-Own Discount
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {vehicle?.year} {vehicle?.make} {vehicle?.model}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              {vehicle?.mileage?.toLocaleString()} miles
                            </p>
                          </div>
                          {vehicle?.has_awd && (
                            <Badge variant="outline" className="text-xs">
                              <Snowflake className="h-3 w-3 mr-1" />
                              AWD
                            </Badge>
                          )}
                        </div>
                        
                        {/* Rental History */}
                        {hasRentalHistory && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <History className="h-3 w-3" />
                            <span>
                              Rented {new Date(hasRentalHistory.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div>
                            <span className="text-2xl font-bold text-[#CC0000]">
                              ${listing.asking_price?.toLocaleString()}
                            </span>
                            {hasRentalHistory && listing.rent_to_own_discount_cents > 0 && (
                              <p className="text-xs text-green-600">
                                Your price: ${((listing.asking_price * 100 - listing.rent_to_own_discount_cents) / 100).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(listing.listed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-100 dark:bg-slate-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Not Ready to Buy?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Rent first to test drive before committing. Your rental history 
            unlocks exclusive discounts when you decide to buy.
          </p>
          <Button asChild>
            <Link href="/vehicles">
              Browse Rentals
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
