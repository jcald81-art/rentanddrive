'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Car, 
  Plus, 
  Edit, 
  DollarSign, 
  Calendar,
  Eye,
  Loader2,
  Search,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface HostVehicle {
  id: string
  make: string
  model: string
  year: number
  category: string
  thumbnail: string | null
  daily_rate: number
  is_active: boolean
  is_approved: boolean
  created_at: string
  bookings_this_month?: number
  revenue_this_month?: number
}

export default function HostVehiclesPage() {
  const [vehicles, setVehicles] = useState<HostVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  async function fetchVehicles() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Fetch host's vehicles
    const { data: vehiclesData, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && vehiclesData) {
      // Get booking stats for each vehicle
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const vehiclesWithStats = await Promise.all(
        vehiclesData.map(async (vehicle) => {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('total_amount, status')
            .eq('vehicle_id', vehicle.id)
            .gte('created_at', startOfMonth.toISOString())
            .in('status', ['confirmed', 'completed'])

          const bookingsThisMonth = bookings?.length || 0
          const revenueThisMonth = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

          return {
            ...vehicle,
            bookings_this_month: bookingsThisMonth,
            revenue_this_month: revenueThisMonth,
          }
        })
      )

      setVehicles(vehiclesWithStats)
    }

    setLoading(false)
  }

  async function toggleVehicleStatus(vehicleId: string, newStatus: boolean) {
    setUpdatingId(vehicleId)
    const supabase = createClient()

    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: newStatus })
      .eq('id', vehicleId)

    if (!error) {
      setVehicles(vehicles.map(v => 
        v.id === vehicleId ? { ...v, is_active: newStatus } : v
      ))
    }

    setUpdatingId(null)
  }

  const filteredVehicles = vehicles.filter(v => 
    `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRevenue = vehicles.reduce((sum, v) => sum + (v.revenue_this_month || 0), 0)
  const totalBookings = vehicles.reduce((sum, v) => sum + (v.bookings_this_month || 0), 0)
  const activeVehicles = vehicles.filter(v => v.is_active).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
            <p className="text-muted-foreground mt-1">
              Manage your fleet and track performance
            </p>
          </div>
          <Button asChild className="bg-[#CC0000] hover:bg-[#CC0000]/90">
            <Link href="/dashboard/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Vehicle
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vehicles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicles.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeVehicles} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Daily Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${vehicles.length > 0 
                  ? Math.round(vehicles.reduce((sum, v) => sum + v.daily_rate, 0) / vehicles.length)
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">
                across fleet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Vehicles List */}
        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {vehicles.length === 0 ? 'No vehicles yet' : 'No matching vehicles'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {vehicles.length === 0 
                  ? 'Add your first vehicle to start earning.'
                  : 'Try adjusting your search.'
                }
              </p>
              {vehicles.length === 0 && (
                <Button asChild className="bg-[#CC0000] hover:bg-[#CC0000]/90">
                  <Link href="/dashboard/vehicles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-48 h-32 sm:h-auto bg-muted">
                    {vehicle.thumbnail ? (
                      <img
                        src={vehicle.thumbnail}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          {!vehicle.is_approved && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending Approval
                            </Badge>
                          )}
                          {vehicle.is_approved && vehicle.is_active && (
                            <Badge className="bg-green-600">Active</Badge>
                          )}
                          {vehicle.is_approved && !vehicle.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {vehicle.category}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Daily Rate */}
                        <div className="text-right">
                          <p className="text-2xl font-bold">${vehicle.daily_rate}</p>
                          <p className="text-xs text-muted-foreground">/day</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">This Month: </span>
                        <span className="font-medium">{vehicle.bookings_this_month || 0} bookings</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue: </span>
                        <span className="font-medium text-green-600">
                          ${(vehicle.revenue_this_month || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={vehicle.is_active}
                          onCheckedChange={(checked) => toggleVehicleStatus(vehicle.id, checked)}
                          disabled={!vehicle.is_approved || updatingId === vehicle.id}
                        />
                        <span className="text-sm text-muted-foreground">
                          {vehicle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex-1" />

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/vehicles/${vehicle.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
