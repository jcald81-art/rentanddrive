'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, MapPin, Fuel, Shield, Check, Car, ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  daily_rate: number
  pickup_address?: string
  pickup_instructions?: string
  mileage_limit?: number
  pet_friendly?: boolean
  rules?: {
    smoking_allowed?: boolean
    pets_allowed?: boolean
    festival_friendly?: boolean
    minimum_age?: number
    fuel_policy?: string
  }
  security_deposit_cents?: number
}

interface SettingsData {
  pickupAddress: string
  pickupInstructions: string
  mileageLimit: number
  unlimitedMiles: boolean
  fuelPolicy: 'full_to_full' | 'same_level' | 'prepaid'
  smokingAllowed: boolean
  petsAllowed: boolean
  festivalFriendly: boolean
  minimumAge: number
  securityDeposit: number
  cleaningFee: number
  lateFeePerHour: number
}

export default function VehicleSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = use(params)
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [settings, setSettings] = useState<SettingsData>({
    pickupAddress: '',
    pickupInstructions: '',
    mileageLimit: 200,
    unlimitedMiles: false,
    fuelPolicy: 'full_to_full',
    smokingAllowed: false,
    petsAllowed: false,
    festivalFriendly: false,
    minimumAge: 25,
    securityDeposit: 500,
    cleaningFee: 75,
    lateFeePerHour: 25,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (!error && data) {
        setVehicle(data)
        // Populate settings from vehicle data
        const rules = data.rules || {}
        setSettings(prev => ({
          ...prev,
          pickupAddress: data.pickup_address || '',
          pickupInstructions: data.pickup_instructions || '',
          mileageLimit: data.mileage_limit || 200,
          unlimitedMiles: data.mileage_limit === null,
          fuelPolicy: rules.fuel_policy || 'full_to_full',
          smokingAllowed: rules.smoking_allowed || false,
          petsAllowed: rules.pets_allowed || data.pet_friendly || false,
          festivalFriendly: rules.festival_friendly || false,
          minimumAge: rules.minimum_age || 25,
          securityDeposit: data.security_deposit_cents ? data.security_deposit_cents / 100 : 500,
        }))
      }
      setLoading(false)
    }

    fetchVehicle()
  }, [vehicleId, supabase])

  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
      .from('vehicles')
      .update({
        pickup_address: settings.pickupAddress,
        pickup_instructions: settings.pickupInstructions,
        mileage_limit: settings.unlimitedMiles ? null : settings.mileageLimit,
        pet_friendly: settings.petsAllowed,
        security_deposit_cents: settings.securityDeposit * 100,
        rules: {
          smoking_allowed: settings.smokingAllowed,
          pets_allowed: settings.petsAllowed,
          festival_friendly: settings.festivalFriendly,
          minimum_age: settings.minimumAge,
          fuel_policy: settings.fuelPolicy,
        },
      })
      .eq('id', vehicleId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    
    const { error } = await supabase
      .from('vehicles')
      .update({ status: 'deleted', listing_status: 'deleted' })
      .eq('id', vehicleId)

    if (!error) {
      router.push('/hostslab/rad-fleet-command')
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Vehicle Not Found</h2>
          <Link href="/hostslab/rad-fleet-command">
            <Button>Back to Fleet Command</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hostslab/rad-fleet-command">
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-white/60">Vehicle Settings & Rules</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#e63946] hover:bg-[#e63946]/80"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>

        {/* Pickup Location */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#e63946]" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white/80">Pickup Address</Label>
              <Input
                value={settings.pickupAddress}
                onChange={(e) => setSettings(prev => ({ ...prev, pickupAddress: e.target.value }))}
                placeholder="123 Main St, Reno, NV 89501"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1"
              />
            </div>
            <div>
              <Label className="text-white/80">Pickup Instructions</Label>
              <Textarea
                value={settings.pickupInstructions}
                onChange={(e) => setSettings(prev => ({ ...prev, pickupInstructions: e.target.value }))}
                placeholder="Park in the visitor lot. I'll meet you at the entrance..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 mt-1 min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mileage & Fuel */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-[#e63946]" />
              Mileage & Fuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Unlimited Miles</p>
                <p className="text-white/60 text-sm">No mileage restrictions</p>
              </div>
              <Switch
                checked={settings.unlimitedMiles}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, unlimitedMiles: checked }))}
              />
            </div>

            {!settings.unlimitedMiles && (
              <div>
                <Label className="text-white/80">Daily Mileage Limit</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="50"
                    max="1000"
                    value={settings.mileageLimit}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      mileageLimit: parseInt(e.target.value) || 200 
                    }))}
                    className="bg-white/10 border-white/20 text-white w-32"
                  />
                  <span className="text-white/60">miles/day</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-white/80">Fuel Policy</Label>
              <Select
                value={settings.fuelPolicy}
                onValueChange={(value: SettingsData['fuelPolicy']) => 
                  setSettings(prev => ({ ...prev, fuelPolicy: value }))
                }
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_to_full">Full to Full (recommended)</SelectItem>
                  <SelectItem value="same_level">Return at Same Level</SelectItem>
                  <SelectItem value="prepaid">Prepaid Fuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Policies */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#e63946]" />
              Vehicle Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Smoking Allowed</p>
                </div>
                <Switch
                  checked={settings.smokingAllowed}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smokingAllowed: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Pets Allowed</p>
                </div>
                <Switch
                  checked={settings.petsAllowed}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, petsAllowed: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Festival Friendly</p>
                  <p className="text-white/60 text-xs">Burning Man, etc.</p>
                </div>
                <Switch
                  checked={settings.festivalFriendly}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, festivalFriendly: checked }))}
                />
              </div>

              <div>
                <Label className="text-white/80">Minimum Renter Age</Label>
                <Select
                  value={String(settings.minimumAge)}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, minimumAge: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">18+</SelectItem>
                    <SelectItem value="21">21+</SelectItem>
                    <SelectItem value="25">25+ (recommended)</SelectItem>
                    <SelectItem value="30">30+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-[#e63946]" />
              Additional Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-white/80">Security Deposit ($)</Label>
                <Input
                  type="number"
                  min="0"
                  max="2500"
                  value={settings.securityDeposit}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    securityDeposit: parseInt(e.target.value) || 0 
                  }))}
                  className="bg-white/10 border-white/20 text-white mt-1"
                />
                <p className="text-white/40 text-xs mt-1">Held, not charged</p>
              </div>
              <div>
                <Label className="text-white/80">Cleaning Fee ($)</Label>
                <Input
                  type="number"
                  min="0"
                  max="500"
                  value={settings.cleaningFee}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    cleaningFee: parseInt(e.target.value) || 0 
                  }))}
                  className="bg-white/10 border-white/20 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80">Late Fee ($/hour)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.lateFeePerHour}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    lateFeePerHour: parseInt(e.target.value) || 0 
                  }))}
                  className="bg-white/10 border-white/20 text-white mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Summary */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Policy Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {settings.unlimitedMiles ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Unlimited Miles
                </Badge>
              ) : (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {settings.mileageLimit} mi/day
                </Badge>
              )}
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {settings.fuelPolicy === 'full_to_full' ? 'Full to Full' : 
                 settings.fuelPolicy === 'same_level' ? 'Same Level' : 'Prepaid'}
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {settings.minimumAge}+ only
              </Badge>
              {!settings.smokingAllowed && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  No Smoking
                </Badge>
              )}
              {settings.petsAllowed && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Pet Friendly
                </Badge>
              )}
              {settings.festivalFriendly && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Festival OK
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Delete Vehicle</p>
                <p className="text-white/60 text-sm">
                  This will remove your vehicle from all listings. This action cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove your {vehicle.year} {vehicle.make} {vehicle.model} from 
                      all listings. Any pending bookings will be cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {deleting ? 'Deleting...' : 'Delete Vehicle'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
