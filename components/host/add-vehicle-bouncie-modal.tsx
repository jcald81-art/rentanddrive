'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Car, Radio, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface AddVehicleBouncieModalProps {
  children: ReactNode
}

export function AddVehicleBouncieModal({ children }: AddVehicleBouncieModalProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'vehicle' | 'bouncie' | 'success'>('vehicle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Vehicle form state
  const [vehicleData, setVehicleData] = useState({
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    dailyRate: '',
    locationCity: 'Reno',
    locationState: 'NV',
  })
  
  // Bouncie form state
  const [bouncieDeviceId, setBouncieDeviceId] = useState('')
  const [bouncieNickname, setBouncieNickname] = useState('')
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null)

  const resetForm = () => {
    setStep('vehicle')
    setVehicleData({
      vin: '',
      year: '',
      make: '',
      model: '',
      trim: '',
      dailyRate: '',
      locationCity: 'Reno',
      locationState: 'NV',
    })
    setBouncieDeviceId('')
    setBouncieNickname('')
    setCreatedVehicleId(null)
    setError(null)
  }

  const handleCreateVehicle = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add a vehicle')
        return
      }

      // Create vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          host_id: user.id,
          vin: vehicleData.vin || null,
          year: parseInt(vehicleData.year),
          make: vehicleData.make,
          model: vehicleData.model,
          trim: vehicleData.trim || null,
          daily_rate: parseFloat(vehicleData.dailyRate) || 0,
          location_city: vehicleData.locationCity,
          location_state: vehicleData.locationState,
          status: 'draft',
          listing_status: 'draft',
        })
        .select()
        .single()

      if (vehicleError) {
        throw vehicleError
      }

      setCreatedVehicleId(vehicle.id)
      setStep('bouncie')
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to create vehicle')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkBouncie = async () => {
    if (!createdVehicleId || !bouncieDeviceId) {
      setStep('success') // Skip if no device ID
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Create Bouncie device record
      const { error: bouncieError } = await supabase
        .from('bouncie_devices')
        .insert({
          vehicle_id: createdVehicleId,
          bouncie_device_id: bouncieDeviceId.trim(),
          nickname: bouncieNickname || `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`,
          is_active: true,
          vin: vehicleData.vin || null,
        })

      if (bouncieError) {
        // Check if it's a duplicate device error
        if (bouncieError.code === '23505') {
          setError('This Bouncie device ID is already linked to another vehicle')
          return
        }
        throw bouncieError
      }

      // Update vehicle with bouncie_device_id reference
      await supabase
        .from('vehicles')
        .update({ bouncie_device_id: bouncieDeviceId.trim() })
        .eq('id', createdVehicleId)

      setStep('success')
    } catch (err) {
      console.error('Error linking Bouncie device:', err)
      setError(err instanceof Error ? err.message : 'Failed to link Bouncie device')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipBouncie = () => {
    setStep('success')
  }

  const handleComplete = () => {
    setOpen(false)
    resetForm()
    // Redirect to full vehicle setup wizard
    if (createdVehicleId) {
      router.push(`/host/vehicles/add/details?vehicleId=${createdVehicleId}`)
    } else {
      router.push('/host/vehicles/add/details')
    }
  }

  const handleViewDashboard = () => {
    setOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#0D0D0D] border-white/10 text-white">
        {step === 'vehicle' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-[#D62828]" />
                Add New Vehicle
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter your vehicle details to add it to your fleet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2022"
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    placeholder="Toyota"
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    placeholder="4Runner"
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    placeholder="TRD Pro"
                    value={vehicleData.trim}
                    onChange={(e) => setVehicleData({ ...vehicleData, trim: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vin">VIN (Optional)</Label>
                <Input
                  id="vin"
                  placeholder="1HGCM82633A123456"
                  value={vehicleData.vin}
                  onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 font-mono"
                  maxLength={17}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dailyRate">Daily Rate ($) *</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  placeholder="85"
                  value={vehicleData.dailyRate}
                  onChange={(e) => setVehicleData({ ...vehicleData, dailyRate: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Reno"
                    value={vehicleData.locationCity}
                    onChange={(e) => setVehicleData({ ...vehicleData, locationCity: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NV"
                    value={vehicleData.locationState}
                    onChange={(e) => setVehicleData({ ...vehicleData, locationState: e.target.value.toUpperCase() })}
                    className="bg-white/5 border-white/10"
                    maxLength={2}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateVehicle}
                disabled={loading || !vehicleData.year || !vehicleData.make || !vehicleData.model || !vehicleData.dailyRate}
                className="bg-[#D62828] hover:bg-[#b82222]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'bouncie' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-[#D62828]" />
                Link Bouncie Device
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Connect your Bouncie GPS device for real-time fleet tracking.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bouncieId">Bouncie Device ID</Label>
                <Input
                  id="bouncieId"
                  placeholder="e.g., BC-123456789"
                  value={bouncieDeviceId}
                  onChange={(e) => setBouncieDeviceId(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono"
                />
                <p className="text-xs text-gray-500">
                  Find this on your Bouncie device or in the Bouncie app
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bouncieNickname">Device Nickname (Optional)</Label>
                <Input
                  id="bouncieNickname"
                  placeholder={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                  value={bouncieNickname}
                  onChange={(e) => setBouncieNickname(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  Don&apos;t have a Bouncie device yet? You can skip this step and add it later from your vehicle settings.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkipBouncie}>
                Skip for now
              </Button>
              <Button 
                onClick={handleLinkBouncie}
                disabled={loading}
                className="bg-[#D62828] hover:bg-[#b82222]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    Link Device
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                Vehicle Added!
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Your {vehicleData.year} {vehicleData.make} {vehicleData.model} has been added to your fleet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-medium">
                  {vehicleData.year} {vehicleData.make} {vehicleData.model}
                </p>
                {bouncieDeviceId && (
                  <p className="text-sm text-gray-400 mt-1">
                    Bouncie device linked: {bouncieDeviceId.slice(0, 8)}...
                  </p>
                )}
              </div>
              
              <p className="text-sm text-gray-400 text-center">
                Complete the full setup wizard to add photos, pricing, and publish your listing.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleViewDashboard} className="flex-1">
                Back to Dashboard
              </Button>
              <Button onClick={handleComplete} className="flex-1 bg-[#D62828] hover:bg-[#b82222]">
                Complete Setup
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
