'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { NavHeader } from '@/components/nav-header'
import { UpcomingEvents } from '@/components/upcoming-events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Concierge } from '@/components/concierge'
import { 
  Car, 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  Search,
  Heart,
  MessageCircle,
  ArrowRight,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react'

interface Booking {
  id: string
  start_date: string
  end_date: string
  status: string
  vehicle: {
    make: string
    model: string
    year: number
    thumbnail_url: string | null
  }
}

interface UserProfile {
  full_name: string | null
  total_trips: number
}

export default function RenterSuitePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login?role=renter'
        return
      }
      
      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, total_trips')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      // Fetch upcoming bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          vehicle:vehicles(make, model, year, thumbnail_url)
        `)
        .eq('renter_id', user.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3)

      if (bookingsData) {
        setUpcomingBookings(bookingsData as unknown as Booking[])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <NavHeader />
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#C4813A] to-[#A36A2E] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-white/80 text-lg">
            Welcome to RAD Renters. What would you like to do today?
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/search" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#CC0000]/30">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-[#CC0000]" />
                </div>
                <div>
                  <h3 className="font-semibold">Find a Car</h3>
                  <p className="text-sm text-muted-foreground">Search available vehicles</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/bookings" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#CC0000]/30">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">My Bookings</h3>
                  <p className="text-sm text-muted-foreground">View trips & reservations</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/favorites" className="block">
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-[#CC0000]/30">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Favorites</h3>
                  <p className="text-sm text-muted-foreground">Saved vehicles</p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Trips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Trips
                </CardTitle>
                <CardDescription>Your next scheduled rentals</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <Link key={booking.id} href={`/bookings/${booking.id}`}>
                        <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                            {booking.vehicle.thumbnail_url ? (
                              <img 
                                src={booking.vehicle.thumbnail_url} 
                                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <Car className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming trips scheduled</p>
                    <Link href="/search">
                      <Button className="bg-[#CC0000] hover:bg-[#aa0000]">
                        Find Your Next Ride
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RAD AI Assistant Promo */}
            <Card className="bg-gradient-to-r from-[#FFD84D]/10 to-[#CC0000]/10 border-[#FFD84D]/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#FFD84D] flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Need Help Finding the Perfect Car?</h3>
                    <p className="text-muted-foreground mb-4">
                      RAD, our AI concierge, can help you find the ideal vehicle for your trip. 
                      Just describe what you need and RAD will find the best options for you.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click the chat bubble in the corner to get started, or pause RAD anytime if you prefer to browse on your own.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events - helps renters plan */}
            <UpcomingEvents variant="compact" maxEvents={3} showMarketOutlook={true} />

            {/* Switch to Host Suite */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <HomeIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Are you a host?</h3>
                    <p className="text-sm text-muted-foreground">Manage your vehicles</p>
                  </div>
                </div>
                <Link href="/host/dashboard">
                  <Button variant="outline" className="w-full">
                    Switch to Host Suite
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Trips</span>
                    <span className="font-semibold">{profile?.total_trips || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-semibold">2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" /> Edit Profile
                </Link>
                <Link href="/renter/verify" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" /> Verify License
                </Link>
                <Link href="/help" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" /> Help Center
                </Link>
                <Link href="/messages" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" /> Messages
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Concierge */}
      <Concierge />
    </div>
  )
}
