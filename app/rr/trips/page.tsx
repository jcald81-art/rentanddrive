'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from 'date-fns'
import {
  Calendar, Clock, MapPin, Key, Star, Download, FileText,
  AlertCircle, Plus, ChevronRight, Navigation, Phone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Booking {
  id: string
  start_date: string
  end_date: string
  status: string
  total_price: number
  pickup_address: string
  igloo_pin?: string
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    images: string[]
    host: {
      full_name: string
      phone: string
    }
  }
  has_review: boolean
  carfidelity_report_id?: string
  eagle_location?: {
    lat: number
    lng: number
    updated_at: string
  }
}

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [bookings, setBookings] = useState<{
    upcoming: Booking[]
    active: Booking[]
    past: Booking[]
  }>({ upcoming: [], active: [], past: [] })
  const [loading, setLoading] = useState(true)
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/my')
      if (res.ok) {
        const data = await res.json()
        setBookings({
          upcoming: data.upcoming || [],
          active: data.active || [],
          past: data.past || [],
        })
      }
    } catch (e) {
      // Mock data
      const mockVehicle = {
        id: '1',
        make: 'Toyota',
        model: '4Runner',
        year: 2023,
        images: ['/placeholder.svg'],
        host: { full_name: 'John Host', phone: '775-555-0123' }
      }
      setBookings({
        upcoming: [
          { id: '1', start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), status: 'confirmed', total_price: 267, pickup_address: '123 Main St, Reno, NV', igloo_pin: '4521', vehicle: mockVehicle, has_review: false },
        ],
        active: [
          { id: '2', start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', total_price: 267, pickup_address: '456 Oak Ave, Reno, NV', vehicle: mockVehicle, has_review: false, eagle_location: { lat: 39.5296, lng: -119.8138, updated_at: new Date().toISOString() } },
        ],
        past: [
          { id: '3', start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', total_price: 267, pickup_address: '789 Pine St, Sparks, NV', vehicle: mockVehicle, has_review: false, carfidelity_report_id: 'CFI-20240115-001' },
          { id: '4', start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', total_price: 195, pickup_address: '321 Elm Dr, Reno, NV', vehicle: { ...mockVehicle, make: 'Jeep', model: 'Wrangler', year: 2024 }, has_review: true },
        ],
      })
    }
    setLoading(false)
  }

  const getCountdown = (date: string) => {
    const target = new Date(date)
    const now = new Date()
    return {
      days: Math.max(0, differenceInDays(target, now)),
      hours: Math.max(0, differenceInHours(target, now) % 24),
      minutes: Math.max(0, differenceInMinutes(target, now) % 60),
    }
  }

  const addToCalendar = (booking: Booking) => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    const title = `Trip: ${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`
    const details = `Pickup: ${booking.pickup_address}${booking.igloo_pin ? `\nPIN: ${booking.igloo_pin}` : ''}`
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${format(start, "yyyyMMdd'T'HHmmss")}/${format(end, "yyyyMMdd'T'HHmmss")}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(booking.pickup_address)}`
    window.open(url, '_blank')
  }

  const submitReview = async () => {
    if (!reviewBookingId) return
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: reviewBookingId,
          rating: reviewRating,
          comment: reviewText,
        }),
      })
      if (res.ok) {
        toast.success('Review submitted! Thanks for the feedback.')
        setReviewBookingId(null)
        setReviewRating(5)
        setReviewText('')
        fetchBookings()
      }
    } catch (e) {
      toast.error('Failed to submit review')
    }
  }

  const BookingCard = ({ booking, type }: { booking: Booking; type: 'upcoming' | 'active' | 'past' }) => {
    const countdown = type === 'upcoming' ? getCountdown(booking.start_date) : type === 'active' ? getCountdown(booking.end_date) : null

    return (
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Vehicle Image */}
          <div className="relative w-full md:w-48 aspect-video md:aspect-square flex-shrink-0">
            <Image
              src={booking.vehicle.images[0] || '/placeholder.svg'}
              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
              fill
              className="object-cover"
            />
            <Badge className={`absolute top-2 left-2 ${
              type === 'active' ? 'bg-green-600' : type === 'upcoming' ? 'bg-blue-600' : 'bg-slate-600'
            }`}>
              {type === 'active' ? 'In Progress' : type === 'upcoming' ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>

          <CardContent className="flex-1 p-4">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                {countdown && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">
                      {type === 'active' ? 'Trip ends in' : 'Trip starts in'}
                    </p>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#CC0000]">{countdown.days}</p>
                        <p className="text-[10px] text-slate-500">days</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#CC0000]">{countdown.hours}</p>
                        <p className="text-[10px] text-slate-500">hrs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#CC0000]">{countdown.minutes}</p>
                        <p className="text-[10px] text-slate-500">min</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Address */}
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <MapPin className="h-4 w-4 text-[#CC0000]" />
                <span>{booking.pickup_address}</span>
              </div>

              {/* PIN for upcoming/active */}
              {(type === 'upcoming' || type === 'active') && booking.igloo_pin && (
                <div className="bg-slate-800 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-400 mb-1">SecureLink PIN</p>
                  <p className="text-3xl font-mono font-bold text-white tracking-wider">
                    {booking.igloo_pin}
                  </p>
                </div>
              )}

              {/* Active Trip Map */}
              {type === 'active' && booking.eagle_location && (
                <div className="bg-slate-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-[#CC0000]" />
                      <span className="text-sm text-white">Live Location</span>
                    </div>
                    <Badge variant="outline" className="border-green-500 text-green-400">
                      Eagle Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Updated {format(new Date(booking.eagle_location.updated_at), 'h:mm a')}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {type === 'upcoming' && (
                  <>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => addToCalendar(booking)}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Add to Calendar
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" asChild>
                      <a href={`tel:${booking.vehicle.host.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Contact Host
                      </a>
                    </Button>
                  </>
                )}
                {type === 'active' && (
                  <>
                    <Button size="sm" className="bg-[#CC0000] hover:bg-[#AA0000]">
                      <Plus className="h-4 w-4 mr-1" />
                      Extend Trip
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Report Issue
                    </Button>
                  </>
                )}
                {type === 'past' && (
                  <>
                    {!booking.has_review && (
                      <Button 
                        size="sm" 
                        className="bg-[#CC0000] hover:bg-[#AA0000]"
                        onClick={() => setReviewBookingId(booking.id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Leave Review
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300">
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
{booking.carfidelity_report_id && (
  <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" asChild>
  <Link href={`/inspect/${booking.id}`}>
  <FileText className="h-4 w-4 mr-1" />
Inspection Report
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">My Trips</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#CC0000]">
              Upcoming ({bookings.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-[#CC0000]">
              Active ({bookings.active.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-[#CC0000]">
              Past ({bookings.past.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                  <div className="flex">
                    <div className="w-48 aspect-square bg-slate-800" />
                    <CardContent className="flex-1 p-4 space-y-3">
                      <div className="h-6 bg-slate-800 rounded w-1/2" />
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-16 bg-slate-800 rounded" />
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4">
                {bookings.upcoming.length === 0 ? (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">No upcoming trips</p>
                      <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000]">
                        <Link href="/rr/garage">Find Your Next Ride</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.upcoming.map(booking => (
                    <BookingCard key={booking.id} booking={booking} type="upcoming" />
                  ))
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {bookings.active.length === 0 ? (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No active trips right now</p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.active.map(booking => (
                    <BookingCard key={booking.id} booking={booking} type="active" />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {bookings.past.length === 0 ? (
                  <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No past trips yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.past.map(booking => (
                    <BookingCard key={booking.id} booking={booking} type="past" />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={!!reviewBookingId} onOpenChange={(open) => !open && setReviewBookingId(null)}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Rate Your Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us about your experience..."
                className="bg-slate-800 border-slate-700 text-white"
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-slate-700 text-slate-300" onClick={() => setReviewBookingId(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]" onClick={submitReview}>
                  Submit Review
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
