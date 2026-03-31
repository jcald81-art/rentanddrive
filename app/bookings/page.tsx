'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Car, 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  ChevronRight,
  Key,
  AlertCircle,
  Home,
} from 'lucide-react'


interface Booking {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed'
  total_amount: number
  lockbox_code?: string
  vehicle: {
    make: string
    model: string
    year: number
    thumbnail_url?: string
    location_city: string
  }
  has_review?: boolean
  created_at: string
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return 'Starting now!'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000)
    return () => clearInterval(timer)
  }, [targetDate])

  return <span className="font-mono text-[#CC0000]">{timeLeft}</span>
}

function BookingCard({ booking, showReviewPrompt = false }: { booking: Booking; showReviewPrompt?: boolean }) {
  const isUpcoming = booking.status === 'confirmed' || booking.status === 'active'
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    disputed: 'bg-orange-100 text-orange-800',
  }

  return (
    <Link href={`/bookings/${booking.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {booking.vehicle.thumbnail_url ? (
                <img
                  src={booking.vehicle.thumbnail_url}
                  alt={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground truncate">
                    {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booking.vehicle.location_city}
                  </p>
                </div>
                <Badge className={statusColors[booking.status]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
              
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                
                {isUpcoming && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#CC0000]" />
                    <CountdownTimer targetDate={booking.start_date} />
                  </span>
                )}
                
                {isUpcoming && booking.lockbox_code && (
                  <span className="flex items-center gap-1 bg-[#CC0000]/10 text-[#CC0000] px-2 py-0.5 rounded-full font-mono text-xs">
                    <Key className="h-3 w-3" />
                    {booking.lockbox_code}
                  </span>
                )}
              </div>
              
              {showReviewPrompt && !booking.has_review && booking.status === 'completed' && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#CC0000]" />
                  <span className="text-sm text-[#CC0000] font-medium">Leave a review</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 self-center" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    fetchBookings()
  }, [])

  async function fetchBookings() {
    try {
      const res = await fetch('/api/bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const upcomingBookings = bookings.filter(b => 
    b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
  )
  const pastBookings = bookings.filter(b => b.status === 'completed')
  const cancelledBookings = bookings.filter(b => 
    b.status === 'cancelled' || b.status === 'disputed'
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-background">
  <div className="container mx-auto px-4 py-8 max-w-4xl">
  {/* Breadcrumb */}
  <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
    <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
      <Home className="h-4 w-4" />
      Home
    </Link>
    <ChevronRight className="h-4 w-4" />
    <span className="text-foreground">My Bookings</span>
  </nav>
  <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
          <Link href="/vehicles">
            <Button className="bg-[#CC0000] hover:bg-[#CC0000]/90">
              Book a Vehicle
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming
              {upcomingBookings.length > 0 && (
                <span className="ml-2 bg-[#CC0000] text-white text-xs rounded-full px-2 py-0.5">
                  {upcomingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No upcoming trips</h3>
                  <p className="text-muted-foreground mb-4">
                    Ready for your next adventure?
                  </p>
                  <Link href="/vehicles">
                    <Button className="bg-[#CC0000] hover:bg-[#CC0000]/90">
                      Browse Vehicles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No past trips yet</h3>
                  <p className="text-muted-foreground">
                    Your completed trips will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} showReviewPrompt />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No cancelled bookings</h3>
                  <p className="text-muted-foreground">
                    Cancelled or disputed bookings will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              cancelledBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
