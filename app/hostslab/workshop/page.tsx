'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Tag,
  Zap,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  mileage: number
  thumbnail_url: string | null
  status: 'active' | 'inactive' | 'pending' | 'maintenance'
  daily_rate: number
  dollar_recommended_rate: number | null
  bookings_this_month: number
  revenue_this_month: number
  eagle_connected: boolean
  pulse_health_score: number | null
  is_awd: boolean
  for_sale: boolean
  sell_while_renting: boolean
  asking_price: number | null
  sale_status: string
  listing?: any
}

export default function WorkshopPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  
  // Sell panel state
  const [sellPanelOpen, setSellPanelOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [sellForm, setSellForm] = useState({
    asking_price: '',
    condition: 'good',
    seller_notes: '',
    rent_to_own_discount: '',
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Fast Lane state
  const [fastLaneOpen, setFastLaneOpen] = useState(false)
  const [fastLaneOffers, setFastLaneOffers] = useState<any>(null)
  const [loadingOffers, setLoadingOffers] = useState(false)
  
  // Mark as Sold state
  const [soldDialogOpen, setSoldDialogOpen] = useState(false)
  const [soldCheck, setSoldCheck] = useState<any>(null)
  const [soldPrice, setSoldPrice] = useState('')
  const [bookingAction, setBookingAction] = useState<'honor' | 'cancel' | 'contact'>('honor')

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/hostslab/workshop/vehicles')
      const data = await res.json()
      if (data.vehicles) setVehicles(data.vehicles)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Open sell panel
  const openSellPanel = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setSellForm({
      asking_price: vehicle.asking_price ? String(vehicle.asking_price) : String((vehicle.dollar_recommended_rate || vehicle.daily_rate * 30) * 10),
      condition: vehicle.listing?.condition || 'good',
      seller_notes: vehicle.listing?.seller_notes || '',
      rent_to_own_discount: vehicle.listing?.rent_to_own_discount_cents ? String(vehicle.listing.rent_to_own_discount_cents / 100) : '',
    })
    setSellPanelOpen(true)
  }

  // Toggle sell while renting
  const toggleSellWhileRenting = async (vehicle: Vehicle) => {
    if (vehicle.sell_while_renting) {
      // Turn off - withdraw listing
      try {
        if (vehicle.listing?.id) {
          await fetch(`/api/car-lot/listings/${vehicle.listing.id}`, {
            method: 'DELETE',
          })
        }
        toast.success('Listing removed from Car Lot')
        fetchVehicles()
      } catch (error) {
        toast.error('Failed to remove listing')
      }
    } else {
      // Turn on - open panel
      openSellPanel(vehicle)
    }
  }

  // Submit listing
  const handleSubmitListing = async () => {
    if (!selectedVehicle) return
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/car-lot/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicle.id,
          asking_price: parseFloat(sellForm.asking_price),
          condition: sellForm.condition,
          seller_notes: sellForm.seller_notes,
          rent_to_own_discount_cents: sellForm.rent_to_own_discount ? parseFloat(sellForm.rent_to_own_discount) * 100 : 0,
          sale_type: 'private',
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create listing')
      
      toast.success('Vehicle listed on The Car Lot!')
      setSellPanelOpen(false)
      fetchVehicles()
    } catch (error) {
      toast.error('Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  // Get Fast Lane offers
  const getFastLaneOffers = async () => {
    if (!selectedVehicle?.listing?.id) return
    setLoadingOffers(true)
    
    try {
      const res = await fetch('/api/car-lot/fast-lane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: selectedVehicle.listing.id }),
      })
      
      if (!res.ok) throw new Error('Failed to get offers')
      
      const data = await res.json()
      setFastLaneOffers(data)
      setFastLaneOpen(true)
    } catch (error) {
      toast.error('Failed to get instant offers')
    } finally {
      setLoadingOffers(false)
    }
  }

  // Accept Fast Lane offer
  const acceptOffer = async (buyer: string) => {
    if (!selectedVehicle?.listing?.id) return
    
    try {
      const res = await fetch('/api/car-lot/fast-lane', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: selectedVehicle.listing.id,
          action: 'accept',
          selected_buyer: buyer,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to accept offer')
      
      const data = await res.json()
      toast.success(data.message)
      setFastLaneOpen(false)
      fetchVehicles()
    } catch (error) {
      toast.error('Failed to accept offer')
    }
  }

  // Check conflicts before marking sold
  const checkSoldConflicts = async (vehicle: Vehicle) => {
    if (!vehicle.listing?.id) return
    
    try {
      const res = await fetch(`/api/car-lot/listings/${vehicle.listing.id}/sold`)
      const data = await res.json()
      setSoldCheck(data)
      setSelectedVehicle(vehicle)
      setSoldPrice(String(vehicle.asking_price || ''))
      setSoldDialogOpen(true)
    } catch (error) {
      toast.error('Failed to check vehicle status')
    }
  }

  // Mark as sold
  const handleMarkAsSold = async () => {
    if (!selectedVehicle?.listing?.id) return
    setSubmitting(true)
    
    try {
      const res = await fetch(`/api/car-lot/listings/${selectedVehicle.listing.id}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sold_price: parseFloat(soldPrice),
          booking_action: soldCheck?.future_bookings_count > 0 ? bookingAction : undefined,
        }),
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to mark as sold')
      }
      
      const data = await res.json()
      toast.success(`Congratulations! Total earnings: $${data.summary.total_earnings.toLocaleString()}`)
      setSoldDialogOpen(false)
      fetchVehicles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as sold')
    } finally {
      setSubmitting(false)
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
          <h1 className="text-2xl font-bold">The Garage</h1>
          <p className="text-muted-foreground">Manage your fleet of vehicles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/car-lot">
              <Store className="h-4 w-4 mr-2" />
              View Car Lot
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/vehicles/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Link>
          </Button>
        </div>
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
                  <div className="absolute top-3 right-3 flex gap-1">
                    {getStatusBadge(vehicle.status)}
                  </div>

                  {/* For Sale Tag */}
                  {vehicle.sell_while_renting && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-[#CC0000]">
                        <Tag className="h-3 w-3 mr-1" />
                        For Sale
                      </Badge>
                    </div>
                  )}

                  {/* AWD Badge */}
                  {vehicle.is_awd && (
                    <Badge className="absolute bottom-3 right-3 bg-blue-600">AWD</Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Vehicle Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.mileage?.toLocaleString()} miles
                      </p>
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
                        {vehicle.sell_while_renting && vehicle.listing && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedVehicle(vehicle)
                              getFastLaneOffers()
                            }}>
                              <Zap className="h-4 w-4 mr-2" />
                              Get Fast Lane Offers
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => checkSoldConflicts(vehicle)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Sold
                            </DropdownMenuItem>
                          </>
                        )}
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

                  {/* Sell While Renting Toggle */}
                  <div className="flex items-center justify-between py-3 border-t border-b mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#CC0000]" />
                      <span className="text-sm font-medium">Sell While Renting</span>
                    </div>
                    <Switch
                      checked={vehicle.sell_while_renting}
                      onCheckedChange={() => toggleSellWhileRenting(vehicle)}
                    />
                  </div>

                  {/* For Sale Info */}
                  {vehicle.sell_while_renting && vehicle.asking_price && (
                    <div className="mb-3 p-2 bg-[#CC0000]/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Asking Price</span>
                        <span className="font-bold text-[#CC0000]">
                          ${vehicle.asking_price.toLocaleString()}
                        </span>
                      </div>
                      {vehicle.listing?.inquiries_count > 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">Inquiries</span>
                          <Badge variant="secondary">{vehicle.listing.inquiries_count}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Row */}
                  <div className="flex items-center justify-between">
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

      {/* Sell Panel */}
      <Sheet open={sellPanelOpen} onOpenChange={setSellPanelOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>List on The Car Lot</SheetTitle>
            <SheetDescription>
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            {/* Path Chooser */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 cursor-pointer border-2 border-[#CC0000]">
                <Store className="h-8 w-8 mb-2 text-[#CC0000]" />
                <h4 className="font-semibold">The Car Lot</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Set your own price. Avg 14 days. Higher final price.
                </p>
              </Card>
              <Card 
                className="p-4 cursor-pointer border-2 border-transparent hover:border-muted-foreground/20"
                onClick={() => {
                  setSellPanelOpen(false)
                  if (selectedVehicle) {
                    setSelectedVehicle(selectedVehicle)
                    getFastLaneOffers()
                  }
                }}
              >
                <Zap className="h-8 w-8 mb-2 text-amber-500" />
                <h4 className="font-semibold">The Fast Lane</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Instant offers from 3 buyers. Sell in 48 hours.
                </p>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="asking_price">Asking Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="asking_price"
                    type="number"
                    value={sellForm.asking_price}
                    onChange={(e) => setSellForm({ ...sellForm, asking_price: e.target.value })}
                    className="pl-10"
                    placeholder="Dollar AI suggestion pre-filled"
                  />
                </div>
                {selectedVehicle?.dollar_recommended_rate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dollar suggests: ${((selectedVehicle.dollar_recommended_rate * 10) / 100).toLocaleString()} based on market data
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={sellForm.condition} 
                  onValueChange={(v) => setSellForm({ ...sellForm, condition: v })}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="seller_notes">Seller Notes</Label>
                <Textarea
                  id="seller_notes"
                  value={sellForm.seller_notes}
                  onChange={(e) => setSellForm({ ...sellForm, seller_notes: e.target.value })}
                  placeholder="Describe the vehicle condition, recent maintenance, upgrades..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="rent_to_own">Rent-to-Own Discount (optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rent_to_own"
                    type="number"
                    value={sellForm.rent_to_own_discount}
                    onChange={(e) => setSellForm({ ...sellForm, rent_to_own_discount: e.target.value })}
                    className="pl-10"
                    placeholder="Discount for previous renters"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renters who tried this vehicle get this amount off
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSellPanelOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={handleSubmitListing}
                disabled={!sellForm.asking_price || submitting}
              >
                {submitting ? 'Listing...' : 'List Vehicle'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fast Lane Dialog */}
      <Dialog open={fastLaneOpen} onOpenChange={setFastLaneOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              The Fast Lane - Instant Offers
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
            </DialogDescription>
          </DialogHeader>
          
          {loadingOffers ? (
            <div className="py-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Getting offers from Carvana, CarMax, and local dealers...</p>
            </div>
          ) : fastLaneOffers ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Offers expire in 48 hours
              </div>
              
              {Object.entries(fastLaneOffers.offers).map(([key, offer]: [string, any]) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{offer.name}</h4>
                      <p className="text-2xl font-bold text-[#CC0000]">
                        ${offer.amount.toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      className="bg-[#CC0000] hover:bg-[#AA0000]"
                      onClick={() => acceptOffer(key === 'renocarma' ? 'dealer' : key)}
                    >
                      Accept
                    </Button>
                  </div>
                </Card>
              ))}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // Decline all
                  fetch('/api/car-lot/fast-lane', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      listing_id: selectedVehicle?.listing?.id,
                      action: 'decline',
                    }),
                  }).then(() => {
                    toast.success('Offers declined')
                    setFastLaneOpen(false)
                    fetchVehicles()
                  })
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline All Offers
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Mark as Sold Dialog */}
      <Dialog open={soldDialogOpen} onOpenChange={setSoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Sold</DialogTitle>
            <DialogDescription>
              {selectedVehicle && `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {soldCheck?.has_active_trip && (
              <Card className="p-4 border-destructive bg-destructive/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Active Trip in Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      This vehicle is currently rented. Wait for the trip to end before marking as sold.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {!soldCheck?.has_active_trip && (
              <>
                <div>
                  <Label htmlFor="sold_price">Final Sale Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sold_price"
                      type="number"
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {soldCheck?.future_bookings_count > 0 && (
                  <Card className="p-4 border-amber-500 bg-amber-50 dark:bg-amber-950">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">
                          {soldCheck.future_bookings_count} Future Booking{soldCheck.future_bookings_count !== 1 ? 's' : ''}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          How would you like to handle them?
                        </p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="booking_action"
                              checked={bookingAction === 'honor'}
                              onChange={() => setBookingAction('honor')}
                            />
                            <span className="text-sm">Honor all bookings (sell after)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="booking_action"
                              checked={bookingAction === 'cancel'}
                              onChange={() => setBookingAction('cancel')}
                            />
                            <span className="text-sm">Cancel with full refund</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="booking_action"
                              checked={bookingAction === 'contact'}
                              onChange={() => setBookingAction('contact')}
                            />
                            <span className="text-sm">Contact renters individually</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSoldDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#CC0000] hover:bg-[#AA0000]"
              onClick={handleMarkAsSold}
              disabled={soldCheck?.has_active_trip || !soldPrice || submitting}
            >
              {submitting ? 'Processing...' : 'Confirm Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
