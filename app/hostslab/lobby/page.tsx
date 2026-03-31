'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import {
  Car,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Plus,
  Radar,
  DollarSign,
  MessageSquare,
  Zap,
  Shield,
  Gamepad2,
  Activity,
  Users,
  Clock,
  Wrench,
} from 'lucide-react'
import FleetMap from '@/components/fleet/fleet-map'

interface MorningBrief {
  id: string
  summary: string
  highlights: string[]
  alerts_count: number
  created_at: string
}

interface LabStats {
  activeVehicles: number
  tripsThisMonth: number
  revenueThisMonth: number
  avgRating: number
}

interface AgentStatus {
  name: string
  displayName: string
  status: 'active' | 'idle' | 'error'
  actionsToday: number
  icon: string
}

interface UpcomingBooking {
  id: string
  vehicle: { make: string; model: string; year: number }
  renter: { full_name: string }
  start_date: string
  end_date: string
  total_amount: number
}

interface BreakRoomActivity {
  id: string
  author: string
  content: string
  created_at: string
  reactions: number
}

const AGENT_ICONS: Record<string, React.ReactNode> = {
  securelink: <MessageSquare className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  commandcontrol: <Radar className="h-5 w-5" />,
  pulse: <Activity className="h-5 w-5" />,
  funtime: <Gamepad2 className="h-5 w-5" />,
  diesel: <Wrench className="h-5 w-5" />,
}

export default function LobbyPage() {
  const [brief, setBrief] = useState<MorningBrief | null>(null)
  const [stats, setStats] = useState<LabStats | null>(null)
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [bookings, setBookings] = useState<UpcomingBooking[]>([])
  const [activity, setActivity] = useState<BreakRoomActivity[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/morning-brief').then(r => r.json()),
      fetch('/api/hostslab/stats').then(r => r.json()),
      fetch('/api/hostslab/agents').then(r => r.json()),
      fetch('/api/hostslab/upcoming-bookings').then(r => r.json()),
      fetch('/api/hostslab/break-room/recent').then(r => r.json()),
      fetch('/api/host/fleet/vehicles').then(r => r.json()),
    ])
      .then(([briefData, statsData, agentsData, bookingsData, activityData, vehiclesData]) => {
        if (briefData.brief) setBrief(briefData.brief)
        if (statsData) setStats(statsData)
        if (agentsData.agents) setAgents(agentsData.agents)
        if (bookingsData.bookings) setBookings(bookingsData.bookings)
        if (activityData.posts) setActivity(activityData.posts)
        if (vehiclesData.vehicles) setVehicles(vehiclesData.vehicles)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-background">
  <div className="p-6 space-y-6">
  {/* Morning Brief */}
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CC0000] rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-white">RAD Comms Morning Brief</CardTitle>
                <CardDescription className="text-slate-400">
                  {brief?.created_at 
                    ? new Date(brief.created_at).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'Today'}
                </CardDescription>
              </div>
            </div>
            {brief?.alerts_count && brief.alerts_count > 0 && (
              <Badge variant="destructive">{brief.alerts_count} Alerts</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">{brief?.summary || 'No brief available yet. Check back after 5:30 AM.'}</p>
          {brief?.highlights && brief.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {brief.highlights.map((highlight, i) => (
                <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-200">
                  {highlight}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeVehicles || 0}</p>
                <p className="text-sm text-muted-foreground">Active Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.tripsThisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">Trips This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.revenueThisMonth || 0)}</p>
                <p className="text-sm text-muted-foreground">Lab Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.avgRating?.toFixed(1) || '5.0'}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eagle Mini Map */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Eagle Fleet Tracker</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/hostslab/eagle-command">Eagle Eye HQ</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <FleetMap 
              vehicles={vehicles} 
              onVehicleSelect={() => {}} 
            />
          </div>
        </CardContent>
      </Card>

      {/* R&D Agent Status Row */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>RAD Agent Status</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/hostslab/rd-navigator">RAD Intel</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(agents.length > 0 ? agents : [
              { name: 'securelink', displayName: 'RAD Comms', status: 'active', actionsToday: 0 },
              { name: 'dollar', displayName: 'RAD Pricing', status: 'idle', actionsToday: 0 },
              { name: 'shield', displayName: 'RAD Reputation', status: 'idle', actionsToday: 0 },
              { name: 'commandcontrol', displayName: 'RAD Intel', status: 'idle', actionsToday: 0 },
              { name: 'pulse', displayName: 'RAD Fleet', status: 'active', actionsToday: 0 },
              { name: 'funtime', displayName: 'RAD Rewards', status: 'idle', actionsToday: 0 },
            ]).map((agent) => (
              <div 
                key={agent.name}
                className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
                    {AGENT_ICONS[agent.name] || <Zap className="h-4 w-4" />}
                  </div>
                  <span className="font-medium text-sm">{agent.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                      agent.status === 'error' ? 'bg-red-500' : 'bg-slate-400'
                    }`} />
                    <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{agent.actionsToday} today</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Upcoming Bookings (7 Days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-bold">{formatDate(booking.start_date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.renter.full_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(booking.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Break Room Preview */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#CC0000]" />
                <CardTitle>Break Room</CardTitle>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/hostslab/break-room">Join</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 4).map((post) => (
                  <div key={post.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{post.author}</span>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/hostslab/workshop">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/hostslab/eagle-command">
                <Radar className="h-4 w-4 mr-2" />
                Eagle Eye HQ
              </Link>
            </Button>
            <Button variant="secondary">
              <DollarSign className="h-4 w-4 mr-2" />
              RAD Pricing
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              RAD Comms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}
