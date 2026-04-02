"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Car, Search, MoreVertical, MapPin, Calendar, 
  DollarSign, CheckCircle2, AlertTriangle, Pause, Play,
  Radar, Zap, Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  license_plate: string
  daily_rate_cents: number
  listing_status: string
  status: string
  host_id: string
  location_city: string
  location_state: string
  images: string[]
  created_at: string
  host?: {
    full_name: string
    email: string
  }
  integration?: {
    provider: string
    status: string
  }
}

export default function VehiclesManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchVehicles = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          host:profiles!vehicles_host_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vehicles:', error)
      } else {
        // Fetch integrations for each vehicle
        const vehiclesWithIntegrations = await Promise.all((data || []).map(async (vehicle) => {
          const { data: integration } = await supabase
            .from('vehicle_integrations')
            .select('provider, status')
            .eq('vehicle_id', vehicle.id)
            .single()

          return {
            ...vehicle,
            integration: integration || null,
          }
        }))

        setVehicles(vehiclesWithIntegrations)
      }
      setLoading(false)
    }

    fetchVehicles()
  }, [])

  const toggleVehicleStatus = async (vehicleId: string, currentStatus: string) => {
    const supabase = createClient()
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    await supabase
      .from('vehicles')
      .update({ listing_status: newStatus })
      .eq('id', vehicleId)

    setVehicles(vehicles.map(v => 
      v.id === vehicleId ? { ...v, listing_status: newStatus } : v
    ))
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.host?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      vehicle.listing_status === statusFilter || 
      vehicle.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (vehicle: Vehicle) => {
    const status = vehicle.listing_status || vehicle.status
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
      case 'paused':
        return <Badge className="bg-amber-500/10 text-amber-400 border-0"><Pause className="h-3 w-3 mr-1" />Paused</Badge>
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-400 border-0">Pending</Badge>
      default:
        return <Badge className="bg-white/10 text-white/50 border-0">{status}</Badge>
    }
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-white/50 mt-1">{vehicles.length} total vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            {['all', 'active', 'paused', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-[#FF4D4D] text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-64"
            />
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <Card className="bg-[#151515] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Vehicle</TableHead>
                <TableHead className="text-white/50">Host</TableHead>
                <TableHead className="text-white/50">Location</TableHead>
                <TableHead className="text-white/50">Daily Rate</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-white/50">Tracking</TableHead>
                <TableHead className="text-white/50">Added</TableHead>
                <TableHead className="text-white/50 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse text-white/40">Loading vehicles...</div>
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-white/40">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg bg-white/10 overflow-hidden">
                          {vehicle.images?.[0] ? (
                            <img 
                              src={vehicle.images[0]} 
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-6 w-6 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-white/40 text-xs">{vehicle.vin || vehicle.license_plate || 'No ID'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-white text-sm">{vehicle.host?.full_name || 'Unknown'}</p>
                      <p className="text-white/40 text-xs">{vehicle.host?.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-white/70 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {vehicle.location_city}, {vehicle.location_state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-white text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-green-400" />
                        {((vehicle.daily_rate_cents || 0) / 100).toFixed(0)}/day
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(vehicle)}
                    </TableCell>
                    <TableCell>
                      {vehicle.integration ? (
                        <Badge className={`${
                          vehicle.integration.provider === 'bouncie' 
                            ? 'bg-cyan-500/10 text-cyan-400' 
                            : 'bg-purple-500/10 text-purple-400'
                        } border-0`}>
                          {vehicle.integration.provider === 'bouncie' ? (
                            <Radar className="h-3 w-3 mr-1" />
                          ) : (
                            <Zap className="h-3 w-3 mr-1" />
                          )}
                          {vehicle.integration.provider}
                        </Badge>
                      ) : (
                        <span className="text-white/30 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/50 text-sm">
                      {new Date(vehicle.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/50 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/vehicles/${vehicle.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Listing
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/host/vehicles/${vehicle.id}/settings`} className="cursor-pointer">
                              <Car className="h-4 w-4 mr-2" />
                              Edit Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toggleVehicleStatus(vehicle.id, vehicle.listing_status || vehicle.status)}
                            className="cursor-pointer"
                          >
                            {vehicle.listing_status === 'active' || vehicle.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2 text-amber-500" />
                                <span className="text-amber-500">Pause Listing</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2 text-green-500" />
                                <span className="text-green-500">Activate Listing</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-500">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Flag for Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
