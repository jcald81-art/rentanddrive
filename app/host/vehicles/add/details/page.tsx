'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertTriangle, Loader2, Car, DollarSign, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VehicleMakeModelSelector } from '@/components/vehicles/VehicleMakeModelSelector'

const FEATURES = [
  'AWD/4WD', 'Bluetooth', 'Apple CarPlay', 'Android Auto', 'Backup Camera',
  'Heated Seats', 'Sunroof/Panorama', 'Ski Rack', 'Roof Box', 'Tow Hitch',
  'USB Charging', 'Keyless Entry', 'Pet Friendly', 'Child Seat Available'
]

const ADVENTURE_TAGS = [
  { id: 'ski', label: 'Ski/Snowboard', emoji: '⛷️' },
  { id: 'mtb', label: 'Mountain Biking', emoji: '🚵' },
  { id: 'camping', label: 'Camping', emoji: '🏕️' },
  { id: 'beach', label: 'Beach', emoji: '🏖️' },
  { id: 'offroad', label: 'Off-Road', emoji: '🏜️' },
  { id: 'roadtrip', label: 'Road Trip', emoji: '🛣️' },
]



interface ListingData {
  vin: string
  year: string
  make: string
  model: string
  trim: string
  mileage: string
  daily_rate: string
  features: string[]
  adventure_tags: string[]
  photos: string[]
  location_city: string
  location_state: string
}

export default function VehicleDetailsPage() {
  const router = useRouter()
  const [isDecoding, setIsDecoding] = useState(false)
  const [vinError, setVinError] = useState('')
  const [vinSuccess, setVinSuccess] = useState(false)
  const [recallStatus, setRecallStatus] = useState<{ count: number; open: boolean } | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)

  const [data, setData] = useState<ListingData>({
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: '',
    daily_rate: '',
    features: [],
    adventure_tags: [],
    photos: [],
    location_city: 'Reno',
    location_state: 'NV',
  })

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setData(parsed)
        setDraftRestored(true)
        setTimeout(() => setDraftRestored(false), 3000)
      } catch {}
    }
  }, [])

  // Auto-save to localStorage
  const saveDraft = useCallback(() => {
    localStorage.setItem('rad-listing-draft', JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const timeout = setTimeout(saveDraft, 500)
    return () => clearTimeout(timeout)
  }, [data, saveDraft])

  // VIN decode
  const decodeVin = async () => {
    if (data.vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters')
      return
    }

    setIsDecoding(true)
    setVinError('')
    setVinSuccess(false)

    try {
      const response = await fetch('/api/vehicles/vin-decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: data.vin }),
      })

      const result = await response.json()

      if (!response.ok) {
        setVinError(result.error || 'Failed to decode VIN')
        return
      }

      setData(prev => ({
        ...prev,
        year: result.year,
        make: result.make,
        model: result.model,
        trim: result.trim,
        features: [...new Set([...prev.features, ...result.features])],
      }))
      setRecallStatus(result.recalls)
      setVinSuccess(true)
    } catch {
      setVinError('Network error. Please try again.')
    } finally {
      setIsDecoding(false)
    }
  }

  // Calculate earnings
  const dailyRate = parseFloat(data.daily_rate) || 0
  const daysPerMonth = 15
  const radEarnings = Math.round(dailyRate * daysPerMonth * 0.90)
  const turoEarnings = Math.round(dailyRate * daysPerMonth * 0.70)
  const extraEarnings = radEarnings - turoEarnings

  const toggleFeature = (feature: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const toggleTag = (tagId: string) => {
    setData(prev => ({
      ...prev,
      adventure_tags: prev.adventure_tags.includes(tagId)
        ? prev.adventure_tags.filter(t => t !== tagId)
        : [...prev.adventure_tags, tagId]
    }))
  }

  const canContinue = data.year && data.make && data.model && dailyRate > 0

  const handleContinue = () => {
    saveDraft()
    router.push('/host/vehicles/add/photos')
  }

  return (
    <div className="space-y-8">
      {/* Draft Restored Toast */}
      {draftRestored && (
        <div className="fixed top-20 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right">
          Draft restored
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Add Your Vehicle</h1>
        <p className="text-white/60">Enter your VIN for instant vehicle info, or add manually.</p>
      </div>

      {/* VIN Input */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-[#e63946]" />
            Vehicle Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white/80">VIN (Vehicle Identification Number)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={data.vin}
                onChange={(e) => setData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                onBlur={() => data.vin.length === 17 && decodeVin()}
                placeholder="Enter 17-character VIN"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-lg tracking-wider"
                maxLength={17}
              />
              <Button 
                onClick={decodeVin}
                disabled={isDecoding || data.vin.length !== 17}
                className="bg-[#e63946] hover:bg-[#e63946]/80"
              >
                {isDecoding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decode'}
              </Button>
            </div>
            {vinError && (
              <p className="text-red-400 text-sm mt-1">{vinError}</p>
            )}
            {vinSuccess && (
              <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                <Check className="w-4 h-4" /> Vehicle info loaded
              </p>
            )}
          </div>

          {/* Recall Status */}
          {recallStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${recallStatus.open ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              {recallStatus.open ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{recallStatus.count} open recall(s) found</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Inspektlabs: 0 open recalls</span>
                </>
              )}
            </div>
          )}

          {/* Manual Fallback with Cascading Dropdowns */}
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-white/60 text-sm mb-4">Or enter vehicle details manually:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <VehicleMakeModelSelector
                value={{ year: data.year, make: data.make, model: data.model }}
                onChange={({ year, make, model }) => 
                  setData(prev => ({ ...prev, year, make, model }))
                }
                className="col-span-full sm:col-span-3 grid-cols-1 sm:grid-cols-3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-white/80">Trim (optional)</Label>
                <Input
                  value={data.trim}
                  onChange={(e) => setData(prev => ({ ...prev, trim: e.target.value }))}
                  placeholder="e.g. Premium, Sport"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80">Current Mileage</Label>
                <Input
                  type="number"
                  value={data.mileage}
                  onChange={(e) => setData(prev => ({ ...prev, mileage: e.target.value }))}
                  placeholder="e.g. 45000"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {FEATURES.map(feature => (
              <label
                key={feature}
                className={`
                  flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
                  ${data.features.includes(feature) 
                    ? 'bg-[#e63946]/20 border border-[#e63946]' 
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <Checkbox
                  checked={data.features.includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                  className="border-white/40"
                />
                <span className="text-white text-sm">{feature}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adventure Tags */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Adventure Tags</CardTitle>
          <p className="text-white/60 text-sm">RAD exclusive — help renters find your vehicle for their adventure</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ADVENTURE_TAGS.map(tag => (
              <Badge
                key={tag.id}
                variant={data.adventure_tags.includes(tag.id) ? 'default' : 'outline'}
                className={`
                  cursor-pointer text-base py-2 px-4 transition-all
                  ${data.adventure_tags.includes(tag.id)
                    ? 'bg-[#e63946] hover:bg-[#e63946]/80 border-[#e63946]'
                    : 'bg-transparent border-white/20 text-white hover:bg-white/10'
                  }
                `}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.emoji} {tag.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Rate + Earnings Calculator */}
      <Card className="bg-gradient-to-br from-[#e63946]/20 to-[#0a0f1e] border-[#e63946]/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#e63946]" />
            Set Your Daily Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-white/80">Daily Rate ($)</Label>
            <Input
              type="number"
              value={data.daily_rate}
              onChange={(e) => setData(prev => ({ ...prev, daily_rate: e.target.value }))}
              placeholder="e.g. 85"
              className="bg-white/10 border-white/20 text-white text-2xl font-bold h-14 placeholder:text-white/40"
            />
          </div>

          {dailyRate > 0 && (
            <div className="bg-black/30 rounded-lg p-4 space-y-3">
              <p className="text-white/60 text-sm">
                At ${dailyRate}/day × {daysPerMonth} days/month:
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white">RAD pays you</span>
                  <span className="text-2xl font-bold text-[#e63946]">${radEarnings}/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Turo would pay</span>
                  <span className="text-lg text-white/40 line-through">${turoEarnings}/mo</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-green-400 font-medium">You earn MORE with RAD</span>
                  <span className="text-xl font-bold text-green-400">+${extraEarnings}/mo</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-end pb-20 sm:pb-0">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-8"
        >
          Continue to Photos
        </Button>
      </div>
    </div>
  )
}
