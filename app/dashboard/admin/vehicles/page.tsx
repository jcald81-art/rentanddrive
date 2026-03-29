'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  Car,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  ImageIcon,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  category: string
  daily_rate: number
  location_city: string
  vin: string | null
  has_vin_report: boolean
  is_active: boolean
  is_approved: boolean
  thumbnail_url: string | null
  images: string[]
  host_name: string
  host_email: string
  host_id: string
  created_at: string
  specs: {
    seats: number
    doors: number
    fuel_type: string
    transmission: string
    is_awd: boolean
    has_ski_rack: boolean
    has_tow_hitch: boolean
  }
}

export default function VehicleApprovalPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('filter') === 'pending' ? 'pending' : 'all'
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(initialTab)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [tab])

  async function fetchVehicles() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('status', tab)
      
      const response = await fetch(`/api/admin/vehicles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error)
    }
    setLoading(false)
  }

  async function approveVehicle(vehicleId: string) {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}/approve`, {
        method: 'POST',
      })
      if (response.ok) {
        setViewDialogOpen(false)
        fetchVehicles()
      }
    } catch (error) {
      console.error('Failed to approve vehicle:', error)
    }
    setProcessing(false)
  }

  async function rejectVehicle() {
    if (!selectedVehicle) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/vehicles/${selectedVehicle.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (response.ok) {
        setRejectDialogOpen(false)
        setViewDialogOpen(false)
        setRejectReason('')
        fetchVehicles()
      }
    } catch (error) {
      console.error('Failed to reject vehicle:', error)
    }
    setProcessing(false)
  }

  async function flagVehicle(vehicleId: string) {
    try {
      await fetch(`/api/admin/vehicles/${vehicleId}/flag`, {
        method: 'POST',
      })
      fetchVehicles()
    } catch (error) {
      console.error('Failed to flag vehicle:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const pendingCount = vehicles.filter(v => !v.is_approved).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
        <p className="text-muted-foreground">Review and approve vehicle listings</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="all">All Vehicles</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No vehicles found</p>
                <p className="text-sm text-muted-foreground">
                  {tab === 'pending' 
                    ? 'All vehicles have been reviewed!'
                    : 'No vehicles match this filter'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {vehicle.thumbnail_url ? (
                      <img 
                        src={vehicle.thumbnail_url} 
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {!vehicle.is_approved && (
                        <Badge className="bg-amber-500">Pending</Badge>
                      )}
                      {vehicle.has_vin_report && (
                        <Badge className="bg-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          VIN Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vehicle.location_city}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(vehicle.daily_rate)}/day
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground">
                        Host: {vehicle.host_name}
                      </p>
                      <Badge variant="outline" className="capitalize">{vehicle.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => {
                          setSelectedVehicle(vehicle)
                          setViewDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      {!vehicle.is_approved && (
                        <Button 
                          className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                          onClick={() => approveVehicle(vehicle.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vehicle Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVehicle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </DialogTitle>
                <DialogDescription>
                  Submitted by {selectedVehicle.host_name} ({selectedVehicle.host_email})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Image Gallery */}
                <div className="grid grid-cols-4 gap-2">
                  {selectedVehicle.images?.length > 0 ? (
                    selectedVehicle.images.map((img, index) => (
                      <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <img src={img} alt={`Vehicle photo ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">No photos uploaded</span>
                    </div>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-lg font-bold">{selectedVehicle.specs?.seats || '-'}</p>
                    <p className="text-xs text-muted-foreground">Seats</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-lg font-bold capitalize">{selectedVehicle.specs?.transmission || '-'}</p>
                    <p className="text-xs text-muted-foreground">Transmission</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-lg font-bold capitalize">{selectedVehicle.specs?.fuel_type || '-'}</p>
                    <p className="text-xs text-muted-foreground">Fuel Type</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-lg font-bold">{formatCurrency(selectedVehicle.daily_rate)}</p>
                    <p className="text-xs text-muted-foreground">Per Day</p>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {selectedVehicle.specs?.is_awd && (
                    <Badge variant="secondary">AWD</Badge>
                  )}
                  {selectedVehicle.specs?.has_ski_rack && (
                    <Badge variant="secondary">Ski Rack</Badge>
                  )}
                  {selectedVehicle.specs?.has_tow_hitch && (
                    <Badge variant="secondary">Tow Hitch</Badge>
                  )}
                </div>

                {/* VIN Report */}
                {selectedVehicle.vin && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        VIN Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-mono text-sm">{selectedVehicle.vin}</p>
                      {selectedVehicle.has_vin_report ? (
                        <Badge className="mt-2 bg-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          VIN Report Verified - Clean History
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-2 text-amber-600 border-amber-600">
                          No VIN report purchased
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Location & Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVehicle.location_city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Submitted {formatDate(selectedVehicle.created_at)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => flagVehicle(selectedVehicle.id)}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Flag for Review
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                {!selectedVehicle.is_approved && (
                  <Button
                    className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                    onClick={() => approveVehicle(selectedVehicle.id)}
                    disabled={processing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {processing ? 'Approving...' : 'Approve Vehicle'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Reject Vehicle
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this vehicle. The host will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectVehicle}
              disabled={!rejectReason.trim() || processing}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
