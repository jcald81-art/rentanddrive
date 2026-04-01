'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Car, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  MapPin,
  Users,
  AlertCircle,
  Sparkles
} from 'lucide-react'

/**
 * UberRideWidget - Displays Uber ride estimates and deep link booking
 * 
 * Popular Reno/Tahoe coordinates for reference:
 * - Reno Airport (RNO): 39.4991, -119.7681
 * - Downtown Reno: 39.5296, -119.8138
 * - South Lake Tahoe: 38.9399, -119.9771
 * - North Lake Tahoe (Tahoe City): 39.1677, -120.1455
 * - Incline Village: 39.2515, -119.9531
 * - Squaw Valley (Palisades): 39.1969, -120.2358
 */

interface UberPriceEstimate {
  product_id: string
  display_name: string
  estimate: string
  low_estimate: number
  high_estimate: number
  surge_multiplier: number
  duration: number
  distance: number
}

interface UberTimeEstimate {
  product_id: string
  display_name: string
  estimate: number
}

interface UberProduct {
  product_id: string
  display_name: string
  description: string
  capacity: number
  image: string
}

interface UberEstimatesResponse {
  prices: UberPriceEstimate[]
  times: UberTimeEstimate[]
  products: UberProduct[]
  deepLink: string
  isSandbox: boolean
  mock?: boolean
  error?: string
}

interface UberRideWidgetProps {
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  pickupLabel?: string
  dropoffLabel?: string
  startDate?: Date
  variant?: 'compact' | 'full'
  className?: string
}

// Uber logo SVG
const UberLogo = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
  </svg>
)

export function UberRideWidget({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  pickupLabel = 'Pickup',
  dropoffLabel = 'Dropoff',
  startDate,
  variant = 'full',
  className = '',
}: UberRideWidgetProps) {
  const [estimates, setEstimates] = useState<UberEstimatesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string>('uber-x')

  useEffect(() => {
    fetchEstimates()
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng])

  async function fetchEstimates() {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        pickup_lat: pickupLat.toString(),
        pickup_lng: pickupLng.toString(),
        dropoff_lat: dropoffLat.toString(),
        dropoff_lng: dropoffLng.toString(),
      })

      const response = await fetch(`/api/uber/estimates?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch estimates')
      }

      const data: UberEstimatesResponse = await response.json()
      setEstimates(data)

      // Set default selected product to first available
      if (data.prices?.length > 0) {
        setSelectedProduct(data.prices[0].product_id)
      }
    } catch (err) {
      console.error('[UberWidget] Error:', err)
      setError('Unable to load ride estimates')
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  function formatETA(seconds: number): string {
    const minutes = Math.round(seconds / 60)
    return `${minutes} min`
  }

  const selectedPrice = estimates?.prices.find(p => p.product_id === selectedProduct)
  const selectedTime = estimates?.times.find(t => t.product_id === selectedProduct)

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <Card className={`border-[#000000]/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white font-bold text-sm">Uber</span>
              </div>
              <div>
                <p className="font-medium text-sm">Need a ride?</p>
                {loading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : selectedPrice ? (
                  <p className="text-xs text-muted-foreground">
                    ${selectedPrice.low_estimate}-${selectedPrice.high_estimate} • {formatDuration(selectedPrice.duration)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Get an estimate</p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              className="bg-black hover:bg-black/90 text-white"
              onClick={() => estimates?.deepLink && window.open(estimates.deepLink, '_blank')}
              disabled={!estimates?.deepLink}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Book
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant with all details
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-black text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center">
              <span className="text-black font-bold text-lg">Uber</span>
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Get a Ride to Your Rental
                {estimates?.isSandbox && (
                  <Badge variant="outline" className="border-white/30 text-white/70 text-xs">
                    Sandbox
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-white/70">
                Real-time estimates from Uber
              </CardDescription>
            </div>
          </div>
          {estimates?.mock && (
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Demo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Route Info */}
        <div className="flex items-start gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <div className="w-0.5 h-8 bg-muted" />
            <div className="h-3 w-3 rounded-full bg-[#CC0000]" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium">{pickupLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="font-medium">{dropoffLabel}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Estimates */}
        {!loading && estimates && (
          <>
            {/* Product Tabs */}
            <Tabs value={selectedProduct} onValueChange={setSelectedProduct}>
              <TabsList className="w-full grid grid-cols-3">
                {estimates.prices.slice(0, 3).map((price) => (
                  <TabsTrigger key={price.product_id} value={price.product_id} className="text-xs">
                    {price.display_name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {estimates.prices.map((price) => {
                const timeEst = estimates.times.find(t => t.product_id === price.product_id)
                const product = estimates.products.find(p => p.product_id === price.product_id)

                return (
                  <TabsContent key={price.product_id} value={price.product_id} className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Price */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        <p className="text-lg font-bold">
                          ${price.low_estimate}-${price.high_estimate}
                        </p>
                        <p className="text-xs text-muted-foreground">Estimated fare</p>
                        {price.surge_multiplier > 1 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            {price.surge_multiplier}x surge
                          </Badge>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                        <p className="text-lg font-bold">{formatDuration(price.duration)}</p>
                        <p className="text-xs text-muted-foreground">Trip time</p>
                      </div>

                      {/* ETA */}
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Car className="h-5 w-5 mx-auto mb-1 text-[#CC0000]" />
                        <p className="text-lg font-bold">
                          {timeEst ? formatETA(timeEst.estimate) : '--'}
                        </p>
                        <p className="text-xs text-muted-foreground">Pickup ETA</p>
                      </div>
                    </div>

                    {/* Product Info */}
                    {product && (
                      <div className="flex items-center gap-3 mt-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Up to {product.capacity} passengers</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{price.distance} mi</span>
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>

            {/* Book Button */}
            <Button
              className="w-full h-12 bg-black hover:bg-black/90 text-white text-base font-medium"
              onClick={() => window.open(estimates.deepLink, '_blank')}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Request {selectedPrice?.display_name || 'Uber'} in App
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Opens Uber app with pre-filled pickup &amp; dropoff
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Pre-configured widget for popular Reno/Tahoe routes
export function UberAirportWidget({
  dropoffLat,
  dropoffLng,
  dropoffLabel,
  className = '',
}: {
  dropoffLat: number
  dropoffLng: number
  dropoffLabel: string
  className?: string
}) {
  // Reno-Tahoe International Airport (RNO)
  const RNO_LAT = 39.4991
  const RNO_LNG = -119.7681

  return (
    <UberRideWidget
      pickupLat={RNO_LAT}
      pickupLng={RNO_LNG}
      pickupLabel="Reno Airport (RNO)"
      dropoffLat={dropoffLat}
      dropoffLng={dropoffLng}
      dropoffLabel={dropoffLabel}
      className={className}
    />
  )
}

// Export common Reno/Tahoe coordinates for convenience
export const RENO_TAHOE_LOCATIONS = {
  RNO_AIRPORT: { lat: 39.4991, lng: -119.7681, label: 'Reno Airport (RNO)' },
  DOWNTOWN_RENO: { lat: 39.5296, lng: -119.8138, label: 'Downtown Reno' },
  SOUTH_LAKE_TAHOE: { lat: 38.9399, lng: -119.9771, label: 'South Lake Tahoe' },
  NORTH_LAKE_TAHOE: { lat: 39.1677, lng: -120.1455, label: 'Tahoe City' },
  INCLINE_VILLAGE: { lat: 39.2515, lng: -119.9531, label: 'Incline Village' },
  SQUAW_VALLEY: { lat: 39.1969, lng: -120.2358, label: 'Palisades Tahoe' },
} as const
