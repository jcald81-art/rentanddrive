'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Car,
  DollarSign,
  Calendar,
  Activity,
  Radar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  thumbnail_url: string | null
  status: 'active' | 'inactive' | 'pending' | 'maintenance'
  daily_rate: number
  dollar_recommended_rate: number | null
  bookings_this_month: number
  revenue_this_month: number
  eagle_connected: boolean
  pulse_health_score: number | null
  is_awd: boolean
}

export default function WorkshopPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/hostslab/workshop/vehicles')
      .then(res => res.json())
      .then(data => {
        if (data.vehicles) setVehicles(data.vehicles)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>
      case 'maintenance':
        return <Badge variant="destructive">Maintenance</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getHealthColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const toggleVehicleSelection = (id: string) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedVehicles.length === filteredVehicles.length) {
      setSelectedVehicles([])
    } else {
      setSelectedVehicles(filteredVehicles.map(v => v.id))
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">The Workshop</h1>
          <p className="text-muted-foreground">Manage your fleet of vehicles</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vehicles/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedVehicles.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Bulk Dollar Update
                </Button>
                <Button variant="outline" size="sm">
                  Set Inactive
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedVehicles([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <Card className="py-12">
          <div className="text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">No vehicles found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first vehicle to get started'}
            </p>
            <Button asChild>
              <Link href="/dashboard/vehicles/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="select-all"
              checked={selectedVehicles.length === filteredVehicles.length}
              onCheckedChange={selectAll}
            />
            <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
              Select all ({filteredVehicles.length})
            </label>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className={`overflow-hidden transition-all ${
                  selectedVehicles.includes(vehicle.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Vehicle Image */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                  {vehicle.thumbnail_url ? (
                    <Image
                      src={vehicle.thumbnail_url}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-16 w-16 text-muted-foreground opacity-50" />
                    </div>
                  )}
                  
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3">
                    <Checkbox 
                      checked={selectedVehicles.includes(vehicle.id)}
                      onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                      className="bg-white/90"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(vehicle.status)}
                  </div>

                  {/* AWD Badge */}
                  {vehicle.is_awd && (
                    <Badge className="absolute bottom-3 left-3 bg-blue-600">AWD</Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Vehicle Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/vehicles/${vehicle.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatCurrency(vehicle.daily_rate)}/day</span>
                    {vehicle.dollar_recommended_rate && vehicle.dollar_recommended_rate !== vehicle.daily_rate && (
                      <span className={`text-sm flex items-center gap-1 ${
                        vehicle.dollar_recommended_rate > vehicle.daily_rate 
                          ? 'text-green-600' 
                          : 'text-amber-600'
                      }`}>
                        {vehicle.dollar_recommended_rate > vehicle.daily_rate 
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />
                        }
                        Dollar: {formatCurrency(vehicle.dollar_recommended_rate)}
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{vehicle.bookings_this_month} bookings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(vehicle.revenue_this_month)}</span>
                    </div>
                  </div>

                  {/* Status Row */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Radar className={`h-4 w-4 ${vehicle.eagle_connected ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <span className="text-xs">
                        Eagle {vehicle.eagle_connected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className={`h-4 w-4 ${getHealthColor(vehicle.pulse_health_score)}`} />
                      <span className={`text-xs ${getHealthColor(vehicle.pulse_health_score)}`}>
                        {vehicle.pulse_health_score !== null 
                          ? `Pulse ${vehicle.pulse_health_score}%` 
                          : 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
