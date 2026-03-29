'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2,
  DollarSign,
  Upload,
  X,
  Car,
} from 'lucide-react'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  category: string
  color: string | null
  vin: string | null
  license_plate: string | null
  mileage: number | null
  description: string | null
  is_awd: boolean
  has_ski_rack: boolean
  has_tow_hitch: boolean
  seats: number
  fuel_type: string
  transmission: string
  thumbnail: string | null
  photos: string[]
  daily_rate: number
  weekly_rate: number | null
  monthly_rate: number | null
  security_deposit: number | null
  min_rental_days: number
  max_rental_days: number
  advance_notice_hours: number
  location_city: string
  location_state: string
  pickup_instructions: string | null
  is_active: boolean
  is_approved: boolean
}

const CATEGORIES = [
  { value: 'car', label: 'Car' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'rv', label: 'RV' },
  { value: 'atv', label: 'ATV / UTV' },
]

const FUEL_TYPES = ['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']
const TRANSMISSIONS = ['automatic', 'manual', 'cvt']

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicle()
  }, [id])

  async function fetchVehicle() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('host_id', user.id)
      .single()

    if (error || !data) {
      router.push('/dashboard/vehicles')
      return
    }

    setVehicle(data)
    setLoading(false)
  }

  function updateVehicle(field: string, value: unknown) {
    if (!vehicle) return
    setVehicle({ ...vehicle, [field]: value })
    setSuccessMessage(null)
  }

  async function handleSave() {
    if (!vehicle) return

    setSaving(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        color: vehicle.color,
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        mileage: vehicle.mileage,
        description: vehicle.description,
        is_awd: vehicle.is_awd,
        has_ski_rack: vehicle.has_ski_rack,
        has_tow_hitch: vehicle.has_tow_hitch,
        seats: vehicle.seats,
        fuel_type: vehicle.fuel_type,
        transmission: vehicle.transmission,
        daily_rate: vehicle.daily_rate,
        weekly_rate: vehicle.weekly_rate,
        monthly_rate: vehicle.monthly_rate,
        security_deposit: vehicle.security_deposit,
        min_rental_days: vehicle.min_rental_days,
        max_rental_days: vehicle.max_rental_days,
        advance_notice_hours: vehicle.advance_notice_hours,
        location_city: vehicle.location_city,
        location_state: vehicle.location_state,
        pickup_instructions: vehicle.pickup_instructions,
        is_active: vehicle.is_active,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccessMessage('Vehicle updated successfully')
    }

    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()

    // Soft delete - set is_active to false
    const { error: deleteError } = await supabase
      .from('vehicles')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (!deleteError) {
      router.push('/dashboard/vehicles?deleted=true')
    } else {
      setError(deleteError.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  if (!vehicle) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-2">
              <Link href="/dashboard/vehicles">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vehicles
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={vehicle.is_active}
                onCheckedChange={(checked) => updateVehicle('is_active', checked)}
                disabled={!vehicle.is_approved}
              />
              <span className="text-sm">
                {vehicle.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-500/10 text-green-600 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Basic information about your vehicle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={vehicle.make}
                      onChange={(e) => updateVehicle('make', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={vehicle.model}
                      onChange={(e) => updateVehicle('model', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={vehicle.year}
                      onChange={(e) => updateVehicle('year', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={vehicle.category} 
                      onValueChange={(v) => updateVehicle('category', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={vehicle.color || ''}
                      onChange={(e) => updateVehicle('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      maxLength={17}
                      value={vehicle.vin || ''}
                      onChange={(e) => updateVehicle('vin', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_plate">License Plate</Label>
                    <Input
                      id="license_plate"
                      value={vehicle.license_plate || ''}
                      onChange={(e) => updateVehicle('license_plate', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mileage">Current Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={vehicle.mileage || ''}
                    onChange={(e) => updateVehicle('mileage', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={vehicle.description || ''}
                    onChange={(e) => updateVehicle('description', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Features & Capabilities</CardTitle>
                <CardDescription>What makes your vehicle special</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Capabilities</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="is_awd"
                        checked={vehicle.is_awd}
                        onCheckedChange={(checked) => updateVehicle('is_awd', checked)}
                      />
                      <Label htmlFor="is_awd" className="cursor-pointer">
                        AWD / 4WD - All-wheel or four-wheel drive
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="has_ski_rack"
                        checked={vehicle.has_ski_rack}
                        onCheckedChange={(checked) => updateVehicle('has_ski_rack', checked)}
                      />
                      <Label htmlFor="has_ski_rack" className="cursor-pointer">
                        Ski / Snowboard Rack
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="has_tow_hitch"
                        checked={vehicle.has_tow_hitch}
                        onCheckedChange={(checked) => updateVehicle('has_tow_hitch', checked)}
                      />
                      <Label htmlFor="has_tow_hitch" className="cursor-pointer">
                        Tow Hitch
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="seats">Seats</Label>
                    <Select 
                      value={vehicle.seats.toString()} 
                      onValueChange={(v) => updateVehicle('seats', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} seats
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Select 
                      value={vehicle.fuel_type} 
                      onValueChange={(v) => updateVehicle('fuel_type', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select 
                      value={vehicle.transmission} 
                      onValueChange={(v) => updateVehicle('transmission', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSIONS.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Availability</CardTitle>
                <CardDescription>Set your rates and booking rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="daily_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={vehicle.daily_rate}
                        onChange={(e) => updateVehicle('daily_rate', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weekly_rate">Weekly Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="weekly_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={vehicle.weekly_rate || ''}
                        onChange={(e) => updateVehicle('weekly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="monthly_rate">Monthly Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="monthly_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={vehicle.monthly_rate || ''}
                        onChange={(e) => updateVehicle('monthly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="security_deposit">Security Deposit</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="security_deposit"
                        type="number"
                        min="0"
                        step="0.01"
                        className="pl-10"
                        value={vehicle.security_deposit || ''}
                        onChange={(e) => updateVehicle('security_deposit', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="min_days">Minimum Days</Label>
                    <Input
                      id="min_days"
                      type="number"
                      min="1"
                      value={vehicle.min_rental_days}
                      onChange={(e) => updateVehicle('min_rental_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_days">Maximum Days</Label>
                    <Input
                      id="max_days"
                      type="number"
                      min="1"
                      value={vehicle.max_rental_days}
                      onChange={(e) => updateVehicle('max_rental_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="advance_notice">Advance Notice (hrs)</Label>
                    <Input
                      id="advance_notice"
                      type="number"
                      min="1"
                      value={vehicle.advance_notice_hours}
                      onChange={(e) => updateVehicle('advance_notice_hours', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Manage your vehicle photos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {vehicle.photos?.map((url, index) => (
                    <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 text-xs bg-[#CC0000] text-white px-2 py-1 rounded">
                          Thumbnail
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {(!vehicle.photos || vehicle.photos.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No photos uploaded yet</p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  To add or remove photos, please contact support.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Location</CardTitle>
                <CardDescription>Where renters will pick up the vehicle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="location_city">City</Label>
                    <Input
                      id="location_city"
                      value={vehicle.location_city}
                      onChange={(e) => updateVehicle('location_city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_state">State</Label>
                    <Select 
                      value={vehicle.location_state} 
                      onValueChange={(v) => updateVehicle('location_state', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickup_instructions">Pickup Instructions</Label>
                  <Textarea
                    id="pickup_instructions"
                    rows={4}
                    value={vehicle.pickup_instructions || ''}
                    onChange={(e) => updateVehicle('pickup_instructions', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Vehicle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your listing. Any pending bookings will need to be cancelled.
                  You can reactivate the listing later by contacting support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#CC0000] hover:bg-[#CC0000]/90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
