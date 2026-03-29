'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  Key, 
  Phone, 
  MessageSquare,
  ChevronLeft,
  Check,
  Circle,
  AlertTriangle,
  Star,
  Navigation,
  FileText,
  XCircle,
} from 'lucide-react'

interface BookingDetail {
  id: string
  vehicle_id: string
  renter_id: string
  host_id: string
  start_date: string
  end_date: string
  status: string
  total_amount: number
  daily_rate: number
  platform_fee: number
  security_deposit: number
  lockbox_code?: string
  pickup_location?: string
  pickup_lat?: number
  pickup_lng?: number
  renter_notes?: string
  trip_instructions?: string
  created_at: string
  confirmed_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  vehicle: {
    make: string
    model: string
    year: number
    thumbnail_url?: string
    location_city: string
    location_state?: string
  }
  host: {
    id: string
    full_name: string
    phone?: string
    avatar_url?: string
  }
  has_review?: boolean
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Booking Created', icon: Circle },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'active', label: 'Trip Active', icon: Car },
  { key: 'completed', label: 'Completed', icon: Check },
]

function StatusTimeline({ status, booking }: { status: string; booking: BookingDetail }) {
  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['pending', 'confirmed', 'active', 'completed']
    const currentIndex = statusOrder.indexOf(status)
    const stepIndex = statusOrder.indexOf(stepKey)
    
    if (status === 'cancelled' || status === 'disputed') return 'cancelled'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'upcoming'
  }

  const getStepDate = (stepKey: string) => {
    switch (stepKey) {
      case 'pending': return booking.created_at
      case 'confirmed': return booking.confirmed_at
      case 'active': return booking.started_at
      case 'completed': return booking.completed_at
      default: return null
    }
  }

  if (status === 'cancelled' || status === 'disputed') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
        <XCircle className="h-6 w-6 text-red-600" />
        <div>
          <p className="font-medium text-red-800">
            Booking {status === 'cancelled' ? 'Cancelled' : 'Disputed'}
          </p>
          {booking.cancelled_at && (
            <p className="text-sm text-red-600">
              {new Date(booking.cancelled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {STATUS_STEPS.map((step, index) => {
        const stepStatus = getStepStatus(step.key)
        const stepDate = getStepDate(step.key)
        const Icon = step.icon
        
        return (
          <div key={step.key} className="flex items-start gap-4">
            <div className="relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' ? 'bg-green-600 text-white' :
                stepStatus === 'current' ? 'bg-[#CC0000] text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div className={`absolute top-8 left-1/2 w-0.5 h-8 -translate-x-1/2 ${
                  stepStatus === 'completed' ? 'bg-green-600' : 'bg-muted'
                }`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`font-medium ${
                stepStatus === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
              }`}>
                {step.label}
              </p>
              {stepDate && (
                <p className="text-sm text-muted-foreground">
                  {new Date(stepDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [issueDescription, setIssueDescription] = useState('')
  const [submittingIssue, setSubmittingIssue] = useState(false)

  useEffect(() => {
    fetchBooking()
  }, [id])

  async function fetchBooking() {
    try {
      const res = await fetch(`/api/bookings/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data.booking)
      } else {
        router.push('/bookings')
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error)
      router.push('/bookings')
    } finally {
      setLoading(false)
    }
  }

  async function cancelBooking() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' })
      if (res.ok) {
        fetchBooking()
        setShowCancelDialog(false)
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
    } finally {
      setCancelling(false)
    }
  }

  async function reportIssue() {
    setSubmittingIssue(true)
    try {
      const res = await fetch(`/api/bookings/${id}/report-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: issueDescription }),
      })
      if (res.ok) {
        setShowIssueDialog(false)
        setIssueDescription('')
      }
    } catch (error) {
      console.error('Failed to report issue:', error)
    } finally {
      setSubmittingIssue(false)
    }
  }

  const canCancel = booking && 
    (booking.status === 'pending' || booking.status === 'confirmed') &&
    new Date(booking.start_date).getTime() - Date.now() > 48 * 60 * 60 * 1000

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-lg mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!booking) return null

  const days = Math.ceil(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/bookings" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to bookings
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {booking.vehicle.location_city}
                {booking.vehicle.location_state ? `, ${booking.vehicle.location_state}` : ''}
              </p>
            </div>
            <Badge className={
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'active' ? 'bg-blue-100 text-blue-800' :
              booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lockbox Code - Prominent Display */}
            {booking.lockbox_code && (booking.status === 'confirmed' || booking.status === 'active') && (
              <Card className="border-[#CC0000] bg-[#CC0000]/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#CC0000] flex items-center justify-center">
                      <Key className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Lockbox PIN Code</p>
                      <p className="text-3xl font-mono font-bold text-[#CC0000] tracking-wider">
                        {booking.lockbox_code}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Image */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {booking.vehicle.thumbnail_url ? (
                    <img
                      src={booking.vehicle.thumbnail_url}
                      alt={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#CC0000]" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pick-up</p>
                    <p className="font-semibold">
                      {new Date(booking.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Return</p>
                    <p className="font-semibold">
                      {new Date(booking.end_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{days} day{days !== 1 ? 's' : ''}</p>
                </div>

                {booking.pickup_location && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pickup Location</p>
                        <p className="font-semibold">{booking.pickup_location}</p>
                      </div>
                      {booking.pickup_lat && booking.pickup_lng && (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-[#CC0000] hover:underline"
                        >
                          <Navigation className="h-4 w-4" />
                          Directions
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Instructions */}
            {booking.trip_instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#CC0000]" />
                    Trip Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {booking.trip_instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#CC0000]" />
                  Booking Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline status={booking.status} booking={booking} />
              </CardContent>
            </Card>

            {/* Review Prompt */}
            {booking.status === 'completed' && !booking.has_review && (
              <Card className="border-[#CC0000]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                      <Star className="h-6 w-6 text-[#CC0000]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">How was your trip?</h3>
                      <p className="text-sm text-muted-foreground">
                        Leave a review to help other renters
                      </p>
                    </div>
                    <Link href={`/bookings/${booking.id}/review`}>
                      <Button className="bg-[#CC0000] hover:bg-[#CC0000]/90">
                        Write Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${(booking.daily_rate / 100).toFixed(2)} x {days} days
                  </span>
                  <span>${((booking.daily_rate * days) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span>${(booking.platform_fee / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Security deposit (refundable)</span>
                  <span>${(booking.security_deposit / 100).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${(booking.total_amount / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Host Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Your Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                    {booking.host.avatar_url ? (
                      <img
                        src={booking.host.avatar_url}
                        alt={booking.host.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-medium">
                        {booking.host.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{booking.host.full_name}</p>
                    <p className="text-sm text-muted-foreground">Vehicle owner</p>
                  </div>
                </div>
                {booking.host.phone && (
                  <a href={`tel:${booking.host.phone}`}>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Host
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {canCancel && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Booking?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel this booking? You will receive a full refund since you are cancelling more than 48 hours before the trip starts.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Booking
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={cancelBooking}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report an Issue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription>
                      Describe the issue you&apos;re experiencing with this booking. Our support team will respond within 24 hours.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Describe the issue..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={4}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={reportIssue}
                      disabled={!issueDescription.trim() || submittingIssue}
                      className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                    >
                      {submittingIssue ? 'Submitting...' : 'Submit Issue'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Link href="/help" className="block">
                <Button variant="ghost" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Get Help
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
