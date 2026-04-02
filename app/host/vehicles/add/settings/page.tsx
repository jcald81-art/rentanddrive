'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, MapPin, Fuel, Shield, Check, AlertTriangle, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  requireInsurance: boolean
  requireVerifiedId: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)
  
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
    requireInsurance: true,
    requireVerifiedId: true,
  })

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setListingData(parsed)
        if (parsed.settings) {
          setSettings(prev => ({ ...prev, ...parsed.settings }))
        }
        // Pre-fill location if available
        if (parsed.location_city && parsed.location_state && !settings.pickupAddress) {
          setSettings(prev => ({
            ...prev,
            pickupAddress: `${parsed.location_city}, ${parsed.location_state}`
          }))
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save draft
  const saveDraft = useCallback(() => {
    if (listingData) {
      localStorage.setItem('rad-listing-draft', JSON.stringify({
        ...listingData,
        settings,
      }))
    }
  }, [listingData, settings])

  useEffect(() => {
    const timeout = setTimeout(saveDraft, 500)
    return () => clearTimeout(timeout)
  }, [settings, saveDraft])

  const handleContinue = () => {
    saveDraft()
    router.push('/host/vehicles/add/payout')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Vehicle Rules & Settings</h1>
        <p className="text-white/60">
          Set policies for your rental to protect your vehicle and set expectations.
        </p>
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
            <p className="text-white/40 text-xs mt-1">
              This will be shown to renters after booking is confirmed
            </p>
          </div>
          <div>
            <Label className="text-white/80">Pickup Instructions</Label>
            <Textarea
              value={settings.pickupInstructions}
              onChange={(e) => setSettings(prev => ({ ...prev, pickupInstructions: e.target.value }))}
              placeholder="Park in the visitor lot. I'll meet you at the entrance. Call when you arrive..."
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
              <p className="text-white/60 text-sm">No mileage restrictions for renters</p>
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
              <p className="text-white/40 text-xs mt-1">
                Extra miles charged at $0.35/mile
              </p>
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
                <p className="text-white/60 text-xs">Allow smoking in vehicle</p>
              </div>
              <Switch
                checked={settings.smokingAllowed}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smokingAllowed: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Pets Allowed</p>
                <p className="text-white/60 text-xs">Allow pets in vehicle</p>
              </div>
              <Switch
                checked={settings.petsAllowed}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, petsAllowed: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Festival Friendly</p>
                <p className="text-white/60 text-xs">OK for Burning Man, etc.</p>
              </div>
              <Switch
                checked={settings.festivalFriendly}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, festivalFriendly: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Require Insurance</p>
                <p className="text-white/60 text-xs">Renter must have coverage</p>
              </div>
              <Switch
                checked={settings.requireInsurance}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireInsurance: checked }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-white/80">Minimum Renter Age</Label>
            <Select
              value={String(settings.minimumAge)}
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, minimumAge: parseInt(value) }))
              }
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white mt-1 w-40">
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
              <p className="text-white/40 text-xs mt-1">One-time per trip</p>
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
              <p className="text-white/40 text-xs mt-1">After 30-min grace</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-white font-medium">RAD Safety Standards</p>
              <p className="text-white/70 text-sm">
                All renters are verified with government ID, driver&apos;s license, and insurance before 
                they can book. You&apos;re protected by our $1M liability coverage.
              </p>
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
            {settings.securityDeposit > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                ${settings.securityDeposit} deposit
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pb-20 sm:pb-0">
        <Button
          variant="outline"
          onClick={() => router.push('/host/vehicles/add/availability')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-8"
        >
          Continue to Payout
        </Button>
      </div>
    </div>
  )
}
