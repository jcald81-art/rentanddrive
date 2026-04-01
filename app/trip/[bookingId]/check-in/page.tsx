'use client'
// Force build cache invalidation - dynamic route uses [bookingId] param
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle2, 
  Car, 
  Key, 
  MapPin, 
  Camera, 
  FileCheck,
  AlertCircle,
  Loader2,
  Navigation,
  Phone,
} from 'lucide-react'

interface CheckInData {
  booking: {
    id: string
    booking_number: string
    start_date: string
    end_date: string
    lockbox_code?: string
    status: string
  }
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color?: string
    license_plate?: string
    thumbnail_url?: string
    location_address?: string
    location_city?: string
    location_lat?: number
    location_lng?: number
  }
  host: {
    full_name: string
    phone?: string
  }
}

export default function MobileCheckInPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.bookingId as string
  const bookingCode = searchParams.get('code')

  const [checkInData, setCheckInData] = useState<CheckInData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkInComplete, setCheckInComplete] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    async function fetchCheckInData() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        if (!res.ok) throw new Error('Booking not found')
        
        const data = await res.json()
        
        // Verify booking code matches
        if (data.booking.booking_number !== bookingCode) {
          throw new Error('Invalid check-in code')
        }
        
        setCheckInData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load check-in data')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId && bookingCode) {
      fetchCheckInData()
    } else {
      setError('Invalid check-in link')
      setLoading(false)
    }
  }, [bookingId, bookingCode])

  async function handleCheckIn() {
    setCheckingIn(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: bookingCode }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Check-in failed')
      }
      
      setCheckInComplete(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed')
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#CC0000]" />
          <p className="text-muted-foreground">Loading check-in...</p>
        </div>
      </div>
    )
  }

  if (error || !checkInData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Check-in Error</h1>
            <p className="text-muted-foreground mb-6">{error || 'Unable to load check-in data'}</p>
            <Button asChild variant="outline">
              <Link href="/bookings">View My Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (checkInComplete) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check-in Complete!</h1>
            <p className="text-muted-foreground">
              You&apos;re all set. Enjoy your trip!
            </p>
          </div>

          {/* Lockbox Code - Prominent Display */}
          {checkInData.booking.lockbox_code && (
            <Card className="mb-6 border-[#CC0000] border-2">
              <CardContent className="pt-6 text-center">
                <Key className="h-8 w-8 text-[#CC0000] mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">Your Lockbox Code</p>
                <p className="text-4xl font-mono font-bold tracking-widest text-[#CC0000]">
                  {checkInData.booking.lockbox_code}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            {checkInData.vehicle.location_address && (
              <Button
                className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={() => {
                  const address = encodeURIComponent(checkInData.vehicle.location_address!)
                  window.open(`https://maps.google.com/maps?daddr=${address}`, '_blank')
                }}
              >
                <Navigation className="mr-2 h-5 w-5" />
                Navigate to Vehicle
              </Button>
            )}
            
            {checkInData.host.phone && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${checkInData.host.phone}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  Call Host: {checkInData.host.full_name}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { booking, vehicle, host } = checkInData

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-6">
        <div className="max-w-md mx-auto">
          <Badge className="bg-white/20 text-white mb-2">Mobile Check-in</Badge>
          <h1 className="text-2xl font-bold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Booking #{booking.booking_number}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Vehicle Photo */}
        {vehicle.thumbnail_url && (
          <div className="rounded-xl overflow-hidden">
            <img
              src={vehicle.thumbnail_url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Check-in Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-[#CC0000]" />
              Pre-Trip Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Take Photos</p>
                <p className="text-xs text-muted-foreground">
                  Document any existing damage before driving
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Car className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Inspect Vehicle</p>
                <p className="text-xs text-muted-foreground">
                  Check tires, lights, and interior condition
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Locate Key</p>
                <p className="text-xs text-muted-foreground">
                  {booking.lockbox_code 
                    ? 'Use the lockbox code after check-in'
                    : 'Meet host for key handoff'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Location */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#CC0000] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.location_address || `${vehicle.location_city}, NV`}
                </p>
                {vehicle.location_address && (
                  <a
                    href={`https://maps.google.com/maps?daddr=${encodeURIComponent(vehicle.location_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#CC0000] hover:underline mt-1 inline-block"
                  >
                    Get Directions
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Contact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Your Host</p>
                <p className="text-sm text-muted-foreground">{host.full_name}</p>
              </div>
              {host.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${host.phone}`}>
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Complete Check-in Button */}
        <Button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="w-full h-14 text-lg bg-[#CC0000] hover:bg-[#AA0000]"
        >
          {checkingIn ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking in...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Complete Check-in
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By checking in, you confirm you have inspected the vehicle
          and agree to the rental terms.
        </p>
      </div>
    </div>
  )
}
