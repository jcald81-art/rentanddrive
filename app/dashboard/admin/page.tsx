'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Car, 
  Users, 
  CalendarCheck, 
  AlertTriangle, 
  Bot,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  revenue_this_month: number
  active_bookings: number
  total_vehicles: number
  pending_verifications: number
  open_disputes: number
  agent_spend_this_month: number
  revenue_last_30_days: { date: string; revenue: number }[]
  recent_bookings: Array<{
    id: string
    booking_number: string
    renter_name: string
    vehicle_name: string
    total_amount: number
    status: string
    created_at: string
  }>
  recent_signups: Array<{
    id: string
    full_name: string
    email: string
    role: string
    created_at: string
  }>
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and quick actions</p>
        </div>
        <Badge variant="outline" className="text-[#CC0000] border-[#CC0000]">
          Admin Access
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.revenue_this_month || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Platform earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_bookings || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles on Platform</CardTitle>
            <Car className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_vehicles || 0}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card className={stats?.pending_verifications ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_verifications || 0}</div>
            <Link href="/dashboard/admin/users?filter=pending_verification" className="text-xs text-[#CC0000] hover:underline">
              Review now →
            </Link>
          </CardContent>
        </Card>

        <Card className={stats?.open_disputes ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open_disputes || 0}</div>
            <Link href="/dashboard/admin/disputes" className="text-xs text-[#CC0000] hover:underline">
              Manage disputes →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Spend This Month</CardTitle>
            <Bot className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.agent_spend_this_month || 0)}</div>
            <p className="text-xs text-muted-foreground">AI model costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Last 30 Days</CardTitle>
          <CardDescription>Daily platform revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-1">
            {stats?.revenue_last_30_days?.map((day, index) => {
              const maxRevenue = Math.max(...(stats.revenue_last_30_days?.map(d => d.revenue) || [1]))
              const height = (day.revenue / maxRevenue) * 100
              return (
                <div
                  key={index}
                  className="flex-1 bg-[#CC0000]/20 hover:bg-[#CC0000]/40 transition-colors rounded-t relative group"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(day.revenue)}
                    <br />
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/admin/vehicles?filter=pending">
          <Card className="hover:border-[#CC0000] transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" />
                Approve Pending Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Review and approve new vehicle listings</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/verifications">
          <Card className="hover:border-[#CC0000] transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Review Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Verify driver licenses and profiles</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/disputes">
          <Card className="hover:border-[#CC0000] transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                View Open Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Resolve booking disputes and refunds</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Last 10 bookings on the platform</CardDescription>
            </div>
            <Link href="/dashboard/admin/bookings">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_bookings?.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{booking.vehicle_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.renter_name} • {booking.booking_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(booking.total_amount)}</p>
                    <Badge 
                      variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'active' ? 'default' :
                        booking.status === 'completed' ? 'secondary' :
                        'outline'
                      }
                      className={booking.status === 'active' ? 'bg-green-600' : ''}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!stats?.recent_bookings || stats.recent_bookings.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent bookings</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Signups</CardTitle>
              <CardDescription>Last 10 users who joined</CardDescription>
            </div>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_signups?.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{user.full_name || 'Unnamed User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              ))}
              {(!stats?.recent_signups || stats.recent_signups.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent signups</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
