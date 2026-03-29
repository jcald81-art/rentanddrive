import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PhotoGallery } from '@/components/vehicles/photo-gallery'
import { PricingCalculator } from '@/components/vehicles/pricing-calculator'
import { HostCard } from '@/components/vehicles/host-card'
import { AvailabilityCalendar } from '@/components/vehicles/availability-calendar'
import { VehicleFeatures } from '@/components/vehicles/vehicle-features'
import { VehicleReviews } from '@/components/vehicles/vehicle-reviews'
import { SimilarVehicles } from '@/components/vehicles/similar-vehicles'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Zap, Mountain, Shield, Check, FileText } from 'lucide-react'
import type { Vehicle } from '@/lib/types/vehicle'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('active_listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const vehicle = await getVehicle(id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  if (!vehicle) {
    return { title: 'Vehicle Not Found | Rent and Drive' }
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} Rental in ${vehicle.location_city || 'Reno'} Nevada`
  const description = `Rent this ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.location_city || 'Reno'}, Nevada. ${vehicle.is_awd ? 'AWD perfect for Tahoe. ' : ''}${vehicle.seats} seats. $${vehicle.daily_rate}/day. Book direct and save 10% vs Turo.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/vehicles/${id}`,
      siteName: 'Rent and Drive',
      images: vehicle.thumbnail_url ? [{
        url: vehicle.thumbnail_url,
        width: 1200,
        height: 630,
        alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: vehicle.thumbnail_url ? [vehicle.thumbnail_url] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}/vehicles/${id}`,
    },
  }
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params
  const vehicle = await getVehicle(id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  if (!vehicle) {
    notFound()
  }

  // JSON-LD Structured Data for Vehicle Listing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.description || `Rent this ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.location_city}, Nevada.`,
    image: vehicle.images?.[0] || vehicle.thumbnail_url,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleModelDate: vehicle.year?.toString(),
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/vehicles/${id}`,
      priceCurrency: 'USD',
      price: vehicle.daily_rate,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Rent and Drive LLC',
        url: baseUrl,
      },
    },
    aggregateRating: vehicle.rating ? {
      '@type': 'AggregateRating',
      ratingValue: vehicle.rating,
      reviewCount: vehicle.review_count || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Seats', value: vehicle.seats },
      { '@type': 'PropertyValue', name: 'AWD', value: vehicle.is_awd ? 'Yes' : 'No' },
      { '@type': 'PropertyValue', name: 'Location', value: `${vehicle.location_city}, ${vehicle.location_state}` },
    ],
  }

  const features = [
    { label: 'Seats', value: `${vehicle.seats} passengers`, available: true },
    { label: 'AWD / 4WD', value: 'All-wheel drive', available: vehicle.is_awd },
    { label: 'Ski Rack', value: 'Roof-mounted', available: vehicle.has_ski_rack },
    { label: 'Tow Hitch', value: 'Towing capable', available: vehicle.has_tow_hitch },
  ]

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="min-h-screen bg-background">
        {/* Value Prop Banner */}
        <div className="bg-primary px-4 py-3 text-center">
        <p className="text-sm font-medium text-primary-foreground">
          Save 10% vs Turo — book direct here for the best price
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Photo Gallery */}
        <PhotoGallery
          images={vehicle.images || [vehicle.thumbnail_url]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        />

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Main Content */}
          <div className="flex-1">
            {/* Title Section */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {vehicle.instant_book && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Zap className="size-3" />
                    Instant Book
                  </Badge>
                )}
                {vehicle.is_awd && (
                  <Badge variant="secondary" className="gap-1">
                    <Mountain className="size-3" />
                    AWD
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-medium text-foreground">
                    {vehicle.rating?.toFixed(1) || 'New'}
                  </span>
                  {vehicle.review_count > 0 && (
                    <span>({vehicle.review_count} reviews)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {vehicle.location_city}, {vehicle.location_state}
                </div>
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-foreground">About this vehicle</h2>
                <p className="text-muted-foreground leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            {/* Features */}
            <VehicleFeatures features={features} />

            {/* Additional Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Additional Features</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {vehicle.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Signals */}
            <div className="mb-8 rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="size-6 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Book with confidence</h2>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Insurance included with every rental
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  24/7 roadside assistance
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Free cancellation up to 24 hours before pickup
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Local Reno-based support team
                </li>
              </ul>
            </div>

            {/* Availability Calendar */}
            <AvailabilityCalendar vehicleId={vehicle.id} />

            {/* VIN History Report */}
            {vehicle.vin_report_url && (
              <div className="mb-8 rounded-lg border bg-green-50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="size-6 text-green-600" />
                  <h2 className="text-lg font-semibold text-foreground">Verified Vehicle History</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  This vehicle has a verified VIN history report showing clean title and no reported accidents.
                </p>
                <a 
                  href={vehicle.vin_report_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green-600 hover:underline"
                >
                  View Full Report →
                </a>
              </div>
            )}

            {/* Reviews Section */}
            <VehicleReviews vehicleId={vehicle.id} />

            {/* Host Card */}
            <HostCard
              hostId={vehicle.host_id}
              hostName={vehicle.host_name}
              hostAvatar={vehicle.host_avatar_url}
              hostRating={vehicle.host_rating}
              hostTrips={vehicle.host_trips}
              hostJoined={vehicle.host_joined}
            />

            {/* Similar Vehicles */}
            <SimilarVehicles 
              currentVehicleId={vehicle.id} 
              category={vehicle.category}
              locationCity={vehicle.location_city}
            />
          </div>

          {/* Pricing Sidebar */}
          <div className="lg:w-96">
            <div className="sticky top-8">
              <PricingCalculator
                vehicleId={vehicle.id}
                dailyRate={vehicle.daily_rate}
                instantBook={vehicle.instant_book}
              />
            </div>
          </div>
          </div>
        </div>
      </main>
    </>
  )
}
