import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  Calendar, 
  CreditCard, 
  Heart, 
  Bell, 
  Users, 
  Search,
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Gift
} from 'lucide-react'
import { DashboardClient } from './dashboard-client'
import { MFASecurityBadge } from '@/components/mfa-enrollment'
import { InviteFriendCard } from '@/components/referrals/invite-friend-card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch all dashboard data in parallel
  const [
    upcomingBookingsResult,
    pastBookingsResult,
    creditsResult,
    wishlistResult,
    notificationsResult,
    userDataResult
  ] = await Promise.all([
    // Upcoming bookings
    supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        start_date,
        end_date,
        total_amount,
        status,
        lyft_pickup_requested,
        lyft_pickup_status,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          thumbnail_url,
          location_city
        ),
        host:users!bookings_host_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('renter_id', user.id)
      .gte('start_date', today)
      .in('status', ['confirmed', 'pending'])
      .order('start_date', { ascending: true })
      .limit(5),
    
    // Past bookings
    supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        start_date,
        end_date,
        total_amount,
        status,
        has_review,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          thumbnail_url
        )
      `)
      .eq('renter_id', user.id)
      .lt('end_date', today)
      .order('end_date', { ascending: false })
      .limit(5),
    
    // User credits
    supabase
      .from('user_credits')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .single(),
    
    // Wishlist/saved vehicles
    supabase
      .from('wishlists')
      .select(`
        id,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          daily_rate,
          thumbnail_url,
          location_city,
          rating
        )
      `)
      .eq('user_id', user.id)
      .limit(6),
    
    // Notifications
    supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),

    // Get referral code
    supabase
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single()
  ])

  const upcomingBookings = upcomingBookingsResult.data || []
  const pastBookings = pastBookingsResult.data || []
  const credits = creditsResult.data || { balance: 0, lifetime_earned: 0 }
  const savedVehicles = wishlistResult.data || []
  const notifications = notificationsResult.data || []
  const referralCode = userDataResult.data?.referral_code || generateReferralCode(user.id)

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D62828] rounded-lg flex items-center justify-center text-white">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">Rent and Drive</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Browse
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">Settings</Button>
            </Link>
            <DashboardClient user={user} />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Renter'}
                </h1>
                <MFASecurityBadge />
              </div>
              <p className="text-muted-foreground mt-1">
                Manage your trips, credits, and saved vehicles
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/vehicles">
                <Button className="bg-[#D62828] hover:bg-[#D62828]/90">
                  <Search className="w-4 h-4 mr-2" />
                  Browse vehicles
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Save 10% Banner */}
        <Card className="mb-8 border-[#D62828]/20 bg-[#D62828]/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D62828]/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#D62828]" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Save 10% vs Turo</p>
                  <p className="text-sm text-muted-foreground">Book direct with Rent and Drive for instant savings</p>
                </div>
              </div>
              <Link href="/vehicles">
                <Button variant="outline" size="sm" className="border-[#D62828] text-[#D62828] hover:bg-[#D62828] hover:text-white">
                  Book direct now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#D62828]/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#D62828]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{upcomingBookings.length}</p>
                  <p className="text-sm text-muted-foreground">Upcoming trips</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">${credits.balance?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-muted-foreground">Credits balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{savedVehicles.length}</p>
                  <p className="text-sm text-muted-foreground">Saved vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{unreadCount}</p>
                  <p className="text-sm text-muted-foreground">Unread notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                  <CardDescription>Your scheduled trips</CardDescription>
                </div>
                <Link href="/bookings">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No upcoming trips</p>
                    <Link href="/vehicles">
                      <Button className="bg-[#D62828] hover:bg-[#D62828]/90">
                        Book your first trip
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-24 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {booking.vehicle?.thumbnail_url ? (
                            <img
                              src={booking.vehicle.thumbnail_url}
                              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium truncate">
                                {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateRange(booking.start_date, booking.end_date)}
                              </p>
                            </div>
                            <StatusBadge status={booking.status} />
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {booking.vehicle?.location_city}
                            </span>
                            <span>#{booking.booking_number}</span>
                          </div>
                          {booking.lyft_pickup_requested && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Car className="w-3 h-3 mr-1" />
                                Lyft pickup: {booking.lyft_pickup_status || 'Scheduled'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Trips */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Past Trips</CardTitle>
                  <CardDescription>Your rental history</CardDescription>
                </div>
                <Link href="/bookings?tab=past">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {pastBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No past trips yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="w-16 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                          {booking.vehicle?.thumbnail_url ? (
                            <img
                              src={booking.vehicle.thumbnail_url}
                              alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateRange(booking.start_date, booking.end_date)}
                          </p>
                        </div>
                        {!booking.has_review ? (
                          <Link href={`/bookings/${booking.id}/review`}>
                            <Button size="sm" variant="outline">
                              <Star className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                          </Link>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Vehicles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Saved Vehicles</CardTitle>
                  <CardDescription>Your wishlist</CardDescription>
                </div>
                <Link href="/saved">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {savedVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No saved vehicles yet</p>
                    <Link href="/vehicles">
                      <Button variant="outline">Browse vehicles</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {savedVehicles.map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/vehicles/${item.vehicle?.id}`}
                        className="group block"
                      >
                        <div className="border rounded-lg overflow-hidden hover:border-[#D62828]/50 transition-colors">
                          <div className="aspect-[4/3] bg-muted relative">
                            {item.vehicle?.thumbnail_url ? (
                              <img
                                src={item.vehicle.thumbnail_url}
                                alt={`${item.vehicle.make} ${item.vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-10 h-10 text-muted-foreground" />
                              </div>
                            )}
                            <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                              <Heart className="w-4 h-4 fill-[#D62828] text-[#D62828]" />
                            </button>
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm truncate group-hover:text-[#D62828] transition-colors">
                              {item.vehicle?.year} {item.vehicle?.make} {item.vehicle?.model}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-muted-foreground">
                                ${item.vehicle?.daily_rate}/day
                              </span>
                              {item.vehicle?.rating && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {item.vehicle.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Credits Card */}
            <Card className="bg-gradient-to-br from-[#0D0D0D] to-[#1a1a1a] text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Credits Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${credits.balance?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Lifetime earned: ${credits.lifetime_earned?.toFixed(2) || '0.00'}
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Earn more credits:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      Refer a friend: $25
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      Complete 5 trips: $10
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Referral Card */}
            <InviteFriendCard />

            {/* Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="bg-[#D62828] text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </CardTitle>
                <Link href="/notifications">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notifications
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.is_read ? 'bg-background' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <NotificationIcon type={notification.type} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-[#D62828] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/vehicles" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="w-4 h-4 mr-2" />
                    Browse vehicles
                  </Button>
                </Link>
                <Link href="/bookings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    My bookings
                  </Button>
                </Link>
                <Link href="/settings/profile" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Edit profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700 border-green-200' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
    completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  )
}

function NotificationIcon({ type }: { type: string }) {
  const iconClass = 'w-4 h-4'
  
  switch (type) {
    case 'booking':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className={`${iconClass} text-green-600`} />
        </div>
      )
    case 'reminder':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Clock className={`${iconClass} text-blue-600`} />
        </div>
      )
    case 'alert':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className={`${iconClass} text-amber-600`} />
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Bell className={`${iconClass} text-gray-600`} />
        </div>
      )
  }
}

function formatDateRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  
  if (startDate.getFullYear() !== endDate.getFullYear()) {
    return `${startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
  }
  
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function generateReferralCode(userId: string) {
  return `RD${userId.slice(0, 6).toUpperCase()}`
}
