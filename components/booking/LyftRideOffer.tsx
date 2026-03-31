'use client'

import { useState } from 'react'
import { CarFront, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LyftRideOfferProps {
  bookingId: string
  vehicleLocation: string
  pickupDate: Date
}

export function LyftRideOffer({ bookingId, vehicleLocation, pickupDate }: LyftRideOfferProps) {
  const [loading, setLoading] = useState(false)
  const [estimate, setEstimate] = useState<{ min: number; max: number; eta: number } | null>(null)

  const handleGetEstimate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lyft/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          destination: vehicleLocation,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setEstimate({
          min: data.estimated_cost_min_cents / 100,
          max: data.estimated_cost_max_cents / 100,
          eta: data.estimated_pickup_minutes,
        })
      }
    } catch (error) {
      console.error('Failed to get Lyft estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookRide = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lyft/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          delivery_type: 'renter_to_vehicle',
          scheduled_at: pickupDate.toISOString(),
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.deep_link) {
          window.open(data.deep_link, '_blank')
        }
      }
    } catch (error) {
      console.error('Failed to dispatch Lyft:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-[#FF00BF]/10 to-[#111827] border-[#FF00BF]/30 mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-full bg-[#FF00BF]/20">
              <CarFront className="size-6 text-[#FF00BF]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Need a ride to your vehicle?</h3>
              <p className="text-gray-400 text-sm mt-1">
                Book a Lyft to the pickup location. We&apos;ll have it ready when you arrive.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          {!estimate ? (
            <Button 
              className="bg-[#FF00BF] hover:bg-[#E600AC] text-white"
              onClick={handleGetEstimate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <CarFront className="size-4 mr-2" />
              )}
              Get Lyft Estimate
            </Button>
          ) : (
            <>
              <Button 
                className="bg-[#FF00BF] hover:bg-[#E600AC] text-white"
                onClick={handleBookRide}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <CarFront className="size-4 mr-2" />
                )}
                Book Lyft - ${estimate.min.toFixed(0)}-${estimate.max.toFixed(0)}
              </Button>
              <span className="text-gray-500 text-sm">
                {estimate.eta} min pickup
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
