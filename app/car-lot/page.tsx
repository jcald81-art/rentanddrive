import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Car, Shield, Radar, DollarSign, Gauge, Calendar,
  Search, SlidersHorizontal, Tag, CheckCircle2, Snowflake
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'The Car Lot | Buy Verified Vehicles | Rent and Drive',
  description: 'Shop Eagle-verified vehicles from trusted hosts. Every car has rental history, Cartegrity inspections, and GPS tracking records. Buy with confidence.',
  openGraph: {
    title: 'The Car Lot | Rent and Drive',
    description: 'Eagle-verified vehicles with complete history',
  },
}

async function getListings(searchParams: Record<string, string>) {
  const supabase = await createClient()
  
  let query = supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, mileage, vin, 
        primary_image_url, images, category, 
        has_awd, license_plate, price_per_day_cents,
        host:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('status', 'active')
    .order('listed_at', { ascending: false })

  // Apply filters
  if (searchParams.minPrice) {
    query = query.gte('asking_price', parseInt(searchParams.minPrice))
  }
  if (searchParams.maxPrice) {
    query = query.lte('asking_price', parseInt(searchParams.maxPrice))
  }
  if (searchParams.make) {
    query = query.ilike('vehicle.make', `%${searchParams.make}%`)
  }

  // Sort
  if (searchParams.sort === 'price_asc') {
    query = query.order('asking_price', { ascending: true })
  } else if (searchParams.sort === 'price_desc') {
    query = query.order('asking_price', { ascending: false })
  } else if (searchParams.sort === 'mileage') {
    query = query.order('vehicle.mileage', { ascending: true })
  }

  const { data, error } = await query.limit(50)
  
  if (error) {
    console.error('Error fetching listings:', error)
    return []
  }
  
  return data || []
}

export default async function CarLotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const listings = await getListings(params)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-[#CC0000]/20 text-[#CC0000] border-[#CC0000]/30">
              <Tag className="h-3 w-3 mr-1" />
              The Car Lot
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Buy Eagle-Verified Vehicles
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              Every vehicle comes with complete rental history, Cartegrity inspection reports, 
              and GPS tracking records. No surprises, just verified vehicles.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Radar className="h-4 w-4 text-[#CC0000]" />
                <span>Eagle GPS Verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-[#CC0000]" />
                <span>Cartegrity Inspected</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-[#CC0000]" />
                <span>Rental History Available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b py-4 sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4">
          <form className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="make"
                  placeholder="Search make or model..."
                  defaultValue={params.make || ''}
                  className="pl-10"
                />
              </div>
            </div>
            <Select name="sort" defaultValue={params.sort || 'newest'}>
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
              name="minPrice"
              type="number"
              placeholder="Min $"
              defaultValue={params.minPrice || ''}
              className="w-[100px]"
            />
            <Input
              name="maxPrice"
              type="number"
              placeholder="Max $"
              defaultValue={params.maxPrice || ''}
              className="w-[100px]"
            />
            <Button type="submit" variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {listings.length} vehicle{listings.length !== 1 ? 's' : ''} for sale
            </p>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No vehicles listed</h2>
              <p className="text-muted-foreground mb-6">
                Check back soon for new listings from verified hosts.
              </p>
              <Button asChild>
                <Link href="/vehicles">Browse Rentals Instead</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing: any) => (
                <Link key={listing.id} href={`/car-lot/${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={listing.vehicle?.primary_image_url || '/placeholder-car.jpg'}
                        alt={`${listing.vehicle?.year} ${listing.vehicle?.make} ${listing.vehicle?.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Eagle Verified Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/80 text-white">
                          <Radar className="h-3 w-3 mr-1 text-[#CC0000]" />
                          Eagle Verified
                        </Badge>
                      </div>
                      {/* Condition Badge */}
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
                            Rent-to-Own Discount
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {listing.vehicle?.year} {listing.vehicle?.make} {listing.vehicle?.model}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            {listing.vehicle?.mileage?.toLocaleString()} miles
                          </p>
                        </div>
                        {listing.vehicle?.has_awd && (
                          <Badge variant="outline" className="text-xs">
                            <Snowflake className="h-3 w-3 mr-1" />
                            AWD
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-2xl font-bold text-[#CC0000]">
                          ${listing.asking_price?.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Listed {new Date(listing.listed_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA for Hosts */}
      <section className="bg-slate-100 dark:bg-slate-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Sell Your Vehicle?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            List your rental vehicle on The Car Lot or get instant offers from Carvana, 
            CarMax, and local dealers through The Fast Lane.
          </p>
          <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000]">
            <Link href="/hostslab/workshop">
              Open Hosts Suite Garage
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
