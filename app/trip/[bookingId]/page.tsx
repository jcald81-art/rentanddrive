'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Car, 
  MapPin, 
  Key, 
  Phone, 
  Mail, 
  Clock, 
  Fuel, 
  Gauge, 
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
  Navigation,
  Shield,
  Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TripDetails {
  id: string
  booking_number: string
  status: string
  start_date: string
  end_date: string
  lockbox_code: string
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color: string
    license_plate: string
    thumbnail_url: string
    fuel_type: string
    description: string
  }
  host: {
    full_name: string
    phone: string
    email: string
  }
}

export default function TripInstructionsPage() {
  const params = useParams()
  const bookingId = params.bookingId as string
  const [trip, setTrip] = useState<TripDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedPin, setCopiedPin] = useState(false)

  useEffect(() => {
    fetchTripDetails()
  }, [bookingId])

  async function fetchTripDetails() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        status,
        start_date,
        end_date,
        lockbox_code,
        pickup_address,
        pickup_lat,
        pickup_lng,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          color,
          license_plate,
          thumbnail_url,
          fuel_type,
          description
        ),
        host:users!bookings_host_id_fkey (
          full_name,
          phone,
          email
        )
      `)
      .eq('id', bookingId)
      .eq('renter_id', user.id)
      .single()

    if (!error && data) {
      setTrip(data as unknown as TripDetails)
    }
    setLoading(false)
  }

  function copyPinCode() {
    if (trip?.lockbox_code) {
      navigator.clipboard.writeText(trip.lockbox_code)
      setCopiedPin(true)
      setTimeout(() => setCopiedPin(false), 2000)
    }
  }

  function getGoogleMapsUrl() {
    if (trip?.pickup_lat && trip?.pickup_lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${trip.pickup_lat},${trip.pickup_lng}`
    }
    if (trip?.pickup_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.pickup_address)}`
    }
    return '#'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Car className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Trip Not Found</h1>
        <p className="text-muted-foreground mb-4">This trip doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Button asChild>
          <Link href="/bookings">View Your Bookings</Link>
        </Button>
      </div>
    )
  }

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Trip Status Banner */}
        <div className="mb-6 rounded-lg bg-[#CC0000] p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Your Trip</p>
              <h1 className="text-xl font-bold">
                {trip.vehicle.year} {trip.vehicle.make} {trip.vehicle.model}
              </h1>
            </div>
            <Badge className="bg-white text-[#CC0000] hover:bg-white/90">
              {trip.status === 'active' ? 'In Progress' : trip.status === 'confirmed' ? 'Ready for Pickup' : trip.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm opacity-90">
            {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* Vehicle Photo */}
        <Card className="mb-6 overflow-hidden">
          <div className="aspect-video relative">
            <img 
              src={trip.vehicle.thumbnail_url || '/placeholder-car.jpg'} 
              alt={`${trip.vehicle.year} ${trip.vehicle.make} ${trip.vehicle.model}`}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{trip.vehicle.color}</Badge>
              <Badge variant="outline">{trip.vehicle.fuel_type}</Badge>
              <Badge variant="outline">Plate: {trip.vehicle.license_plate}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lockbox PIN - Most Important */}
        <Card className="mb-6 border-2 border-[#CC0000]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-[#CC0000]">
              <Key className="h-5 w-5" />
              Igloo Lockbox PIN
            </CardTitle>
            <CardDescription>Enter this code on the lockbox to retrieve the keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-muted rounded-lg p-4">
              <span className="text-4xl font-mono font-bold tracking-widest">
                {trip.lockbox_code || '----'}
              </span>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyPinCode}
                className="shrink-0"
              >
                {copiedPin ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copiedPin && (
              <p className="text-sm text-green-600 mt-2 text-center">PIN copied to clipboard!</p>
            )}
          </CardContent>
        </Card>

        {/* Pickup Location */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#CC0000]" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{trip.pickup_address}</p>
            <Button asChild className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90">
              <a href={getGoogleMapsUrl()} target="_blank" rel="noopener noreferrer">
                <Navigation className="mr-2 h-4 w-4" />
                Get Directions in Google Maps
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Step by Step Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pickup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { step: 1, title: 'Go to the pickup address', description: 'Use the Google Maps link above to navigate to the vehicle location.' },
              { step: 2, title: 'Find the vehicle', description: `Look for a ${trip.vehicle.color} ${trip.vehicle.year} ${trip.vehicle.make} ${trip.vehicle.model}. License plate: ${trip.vehicle.license_plate}` },
              { step: 3, title: 'Locate the Igloo lockbox', description: 'The lockbox is typically attached to the driver side door handle or nearby.' },
              { step: 4, title: 'Enter the PIN code', description: `Press the buttons to enter ${trip.lockbox_code || 'your PIN'}. The lockbox will open.` },
              { step: 5, title: 'Get the keys', description: 'Remove the keys from inside the lockbox. Close and scramble the lockbox.' },
              { step: 6, title: 'Check the vehicle', description: 'Verify fuel level and mileage match the listing. Take photos of any existing damage.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#CC0000] text-white text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Return Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Return Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { step: 1, title: 'Return to the pickup location', description: 'Bring the vehicle back to the same address where you picked it up.' },
              { step: 2, title: 'Refuel if needed', description: 'Return the vehicle with the same fuel level. We include a free Sierra Express car wash!' },
              { step: 3, title: 'Park the vehicle', description: 'Park in the designated spot or where you found it.' },
              { step: 4, title: 'Return the keys', description: 'Place the keys back in the Igloo lockbox and close it securely.' },
              { step: 5, title: 'Take photos', description: 'Snap a few photos of the vehicle as proof of condition at return.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-800">
              If you encounter any issues during pickup or your trip, contact us immediately:
            </p>
            <div className="space-y-2">
              <a 
                href="tel:+17752570000" 
                className="flex items-center gap-3 text-amber-900 hover:underline"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">(775) 257-0000</span>
              </a>
              <a 
                href="mailto:joe@rentanddrive.net" 
                className="flex items-center gap-3 text-amber-900 hover:underline"
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">joe@rentanddrive.net</span>
              </a>
            </div>
            <Separator className="bg-amber-200" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">What to do if issues arise:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Lockbox won&apos;t open: Double-check the PIN code and try again</li>
                <li>Vehicle not at location: Call us immediately</li>
                <li>Vehicle damage: Document with photos before driving</li>
                <li>Accident or breakdown: Call 911 if needed, then contact us</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Insurance Info */}
        <Card className="mb-6">
          <CardContent className="flex items-start gap-3 py-4">
            <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-700">You&apos;re Protected</h4>
              <p className="text-sm text-muted-foreground">
                Your booking includes $1M liability insurance coverage. Drive with confidence!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Reference */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Booking Reference: <span className="font-mono">{trip.booking_number}</span></p>
        </div>
      </div>
    </div>
  )
}
