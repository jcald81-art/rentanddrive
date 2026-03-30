'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Fuel, MapPin, Navigation, RefreshCw, Clock, ExternalLink, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GasStation {
  name: string
  address: string
  price: number
  distance: number
  lastReported: string
  lat: number
  lng: number
}

export default function GasFinderPage() {
  const params = useParams()
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [fuelType, setFuelType] = useState<'regular' | 'midgrade' | 'premium' | 'diesel'>('regular')
  const [averagePrice, setAveragePrice] = useState(3.84)
  const [lastUpdated, setLastUpdated] = useState('2 minutes ago')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default to Reno, NV if location denied
          setUserLocation({ lat: 39.5296, lng: -119.8138 })
        }
      )
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchGasPrices()
    }
  }, [userLocation, fuelType])

  const fetchGasPrices = async () => {
    if (!userLocation) return
    setLoading(true)
    try {
      const fuelTypeMap = { regular: 1, midgrade: 2, premium: 3, diesel: 4 }
      const res = await fetch(
        `/api/gas/prices?lat=${userLocation.lat}&lng=${userLocation.lng}&fuelType=${fuelTypeMap[fuelType]}`
      )
      const data = await res.json()
      if (data.stations) {
        setStations(data.stations)
        setAveragePrice(data.averagePrice || 3.84)
      }
      setLastUpdated('Just now')
    } catch (error) {
      console.error('Failed to fetch gas prices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriceColor = (price: number) => {
    const diff = ((price - averagePrice) / averagePrice) * 100
    if (diff <= -10) return 'text-green-500'
    if (diff <= 5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPriceBgColor = (price: number) => {
    const diff = ((price - averagePrice) / averagePrice) * 100
    if (diff <= -10) return 'bg-green-500/10 border-green-500/30'
    if (diff <= 5) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  const getDirectionsUrl = (station: GasStation) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`
  }

  const cheapestPrice = stations.length > 0 ? Math.min(...stations.map((s) => s.price)) : 0
  const expensivePrice = stations.length > 0 ? Math.max(...stations.map((s) => s.price)) : 0
  const savings = ((expensivePrice - cheapestPrice) * 12).toFixed(2)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Fuel className="h-8 w-8 text-yellow-500" />
                Find Cheap Gas
              </h1>
              <p className="text-muted-foreground mt-1">Based on your current location</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdated}
              </span>
              <Button variant="outline" size="sm" onClick={fetchGasPrices} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Average Price Banner */}
        <Card className="mb-6 bg-muted/50 border-muted">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reno, NV average</p>
                <p className="text-3xl font-mono font-bold">${averagePrice.toFixed(2)}/gal</p>
              </div>
              <Tabs value={fuelType} onValueChange={(v) => setFuelType(v as typeof fuelType)}>
                <TabsList className="bg-background">
                  <TabsTrigger
                    value="regular"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    Regular
                  </TabsTrigger>
                  <TabsTrigger
                    value="midgrade"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    Midgrade
                  </TabsTrigger>
                  <TabsTrigger
                    value="premium"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    Premium
                  </TabsTrigger>
                  <TabsTrigger
                    value="diesel"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    Diesel
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Gas Stations List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Nearby Stations</h2>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stations.map((station, index) => (
                  <Card
                    key={index}
                    className={`border ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{station.name}</h3>
                            {index === 0 && (
                              <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
                                Cheapest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {station.distance.toFixed(1)} miles
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {station.lastReported}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{station.address}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-mono font-bold ${getPriceColor(station.price)}`}>
                            ${station.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">/gallon</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2"
                            asChild
                          >
                            <a href={getDirectionsUrl(station)} target="_blank" rel="noopener noreferrer">
                              <Navigation className="h-3 w-3 mr-1" />
                              Directions
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Savings Callout */}
            {stations.length > 0 && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="py-4">
                  <p className="text-green-500 font-medium">
                    Filling up at {stations[0]?.name} vs the most expensive station saves you{' '}
                    <span className="font-mono font-bold">${savings}</span> on a 12-gallon fill-up!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Map</h2>
            <Card className="border-2 border-dashed border-blue-500/50 bg-muted/30">
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Gas Map — Mapbox or Google Maps integration point
                </p>
                <Button variant="outline" asChild>
                  <a
                    href={`https://www.google.com/maps/search/gas+stations/@${userLocation?.lat || 39.5296},${userLocation?.lng || -119.8138},13z`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Maps
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gas Saving Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Costco/Sams Club typically have the lowest prices</p>
                <p>• Prices are usually cheaper on Mondays and Tuesdays</p>
                <p>• Avoid gas stations near the freeway on-ramps</p>
                <p>• Return with a full tank to avoid $5.99/gal refueling fee</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Back to rental */}
        <div className="mt-8">
          <Link
            href={`/rental/${params.rentalId}`}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to rental details
          </Link>
        </div>
      </div>
    </div>
  )
}
