'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Fuel, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GasStation {
  name: string
  price: number
  distance: number
}

interface GasFinderWidgetProps {
  rentalId: string
  lat?: number
  lng?: number
}

export function GasFinderWidget({ rentalId, lat, lng }: GasFinderWidgetProps) {
  const [stations, setStations] = useState<GasStation[]>([])
  const [averagePrice, setAveragePrice] = useState(3.84)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const useLat = lat || 39.5296
        const useLng = lng || -119.8138
        const res = await fetch(`/api/gas/prices?lat=${useLat}&lng=${useLng}&fuelType=1`)
        const data = await res.json()
        if (data.stations) {
          setStations(data.stations.slice(0, 3))
          setAveragePrice(data.averagePrice || 3.84)
        }
      } catch (error) {
        console.error('Failed to fetch gas prices:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
  }, [lat, lng])

  const getPriceColor = (price: number) => {
    const diff = ((price - averagePrice) / averagePrice) * 100
    if (diff <= -10) return 'text-green-500'
    if (diff <= 5) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-4">
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Fuel className="h-5 w-5 text-yellow-500" />
          Cheap Gas Nearby
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reno avg: <span className="font-mono">${averagePrice.toFixed(2)}/gal</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stations.map((station, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{station.name}</p>
                {index === 0 && (
                  <Badge className="bg-yellow-500 text-black text-xs px-1.5 py-0">
                    Cheapest
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {station.distance.toFixed(1)} mi
              </p>
            </div>
            <p className={`font-mono font-bold ${getPriceColor(station.price)}`}>
              ${station.price.toFixed(2)}
            </p>
          </div>
        ))}

        <Link
          href={`/rental/${rentalId}/gas`}
          className="flex items-center justify-center gap-1 text-sm text-yellow-500 hover:text-yellow-400 mt-2 pt-2 border-t border-border"
        >
          Find All Stations
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
