'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VehicleMakeModelSelector } from '@/components/vehicles/VehicleMakeModelSelector'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Car, ArrowLeft, Brain, Sparkles } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

type VehicleType = 'car' | 'motorcycle'

export default function ListVehiclePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Vehicle info state
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleType: 'car' as VehicleType,
    year: '',
    make: '',
    model: '',
  })
  const [category, setCategory] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [aiPricingEnabled, setAiPricingEnabled] = useState(false)
  const [aiPricingLoading, setAiPricingLoading] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<{
    rate: number
    reasoning: string
    confidence: string
  } | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Reno, NV')

  // Category options based on vehicle type
  const categoryOptions = vehicleInfo.vehicleType === 'motorcycle'
    ? [
        { value: 'cruiser', label: 'Cruiser' },
        { value: 'sportbike', label: 'Sport Bike' },
        { value: 'touring', label: 'Touring' },
        { value: 'adventure', label: 'Adventure / Dual Sport' },
        { value: 'standard', label: 'Standard' },
        { value: 'scooter', label: 'Scooter' },
      ]
    : [
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV' },
        { value: 'truck', label: 'Truck' },
        { value: 'coupe', label: 'Coupe' },
        { value: 'convertible', label: 'Convertible' },
        { value: 'van', label: 'Van / Minivan' },
        { value: 'wagon', label: 'Wagon' },
        { value: 'rv', label: 'RV / Campervan' },
        { value: 'atv', label: 'ATV / Side-by-Side' },
      ]

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in?redirect=/list-vehicle')
      } else {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [router])

  // Reset category when vehicle type changes
  useEffect(() => {
    setCategory('')
  }, [vehicleInfo.vehicleType])

  // Fetch AI pricing recommendation when toggle is enabled and vehicle info is complete
  useEffect(() => {
    async function fetchAiPricing() {
      if (!aiPricingEnabled) {
        setAiRecommendation(null)
        return
      }

      // Need make, model, year to get pricing
      if (!vehicleInfo.make || !vehicleInfo.model || !vehicleInfo.year) {
        return
      }

      setAiPricingLoading(true)
      try {
        const res = await fetch('/api/vehicles/ai-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            year: vehicleInfo.year,
            category,
            vehicleType: vehicleInfo.vehicleType,
            location,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setAiRecommendation({
            rate: data.recommendedRate,
            reasoning: data.reasoning,
            confidence: data.confidence,
          })
          // Auto-populate the daily rate field
          setDailyRate(String(data.recommendedRate))
        }
      } catch (err) {
        console.error('Failed to fetch AI pricing:', err)
      } finally {
        setAiPricingLoading(false)
      }
    }

    fetchAiPricing()
  }, [aiPricingEnabled, vehicleInfo.make, vehicleInfo.model, vehicleInfo.year, category, vehicleInfo.vehicleType, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in?redirect=/list-vehicle')
        return
      }

      // Validate required fields
      if (!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) {
        throw new Error('Please select year, make, and model')
      }
      if (!category) {
        throw new Error('Please select a category')
      }
      if (!dailyRate || parseFloat(dailyRate) <= 0) {
        throw new Error('Please enter a valid daily rate')
      }

      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          host_id: user.id,
          make: vehicleInfo.make,
          model: vehicleInfo.model,
          year: parseInt(vehicleInfo.year),
          category,
          vehicle_type: vehicleInfo.vehicleType,
          daily_rate: parseFloat(dailyRate),
          ai_pricing_enabled: aiPricingEnabled,
          description,
          location,
          status: 'pending_review'
        })

      if (insertError) throw insertError
      router.push('/dashboard?listed=true')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to list vehicle')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#CC0000] rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">List Your Vehicle</h1>
              <p className="text-muted-foreground">Start earning money by sharing your vehicle</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 md:p-8 shadow-2xl border border-border">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Type, Year, Make, Model - Cascading Selector */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#CC0000] text-white rounded-full flex items-center justify-center text-sm">1</span>
                Vehicle Information
              </h3>
              <VehicleMakeModelSelector
                value={vehicleInfo}
                onChange={setVehicleInfo}
                disabled={isLoading}
                showVehicleType={true}
                className="grid-cols-1"
              />
            </div>

            {/* Category */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#CC0000] text-white rounded-full flex items-center justify-center text-sm">2</span>
                Category
              </h3>
              <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#CC0000] text-white rounded-full flex items-center justify-center text-sm">3</span>
                Pricing & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyRate" className="text-foreground">Daily Rate ($)</Label>
                  <div className="relative">
                    <Input
                      id="dailyRate"
                      type="number"
                      placeholder="e.g., 75"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      required
                      min="1"
                      disabled={isLoading || aiPricingLoading}
                      className={aiRecommendation ? 'pr-10' : ''}
                    />
                    {aiPricingLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#CC0000]" />
                      </div>
                    )}
                  </div>
                  {/* AI Recommendation Message */}
                  {aiRecommendation && aiPricingEnabled && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-[#CC0000]/5 rounded-md">
                      <Sparkles className="h-4 w-4 text-[#CC0000] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">RAD recommends ${aiRecommendation.rate}</span>
                        {' '}based on {aiRecommendation.reasoning.toLowerCase()}
                        {aiRecommendation.confidence === 'high' && ' (high confidence)'}
                        . You can still adjust manually.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Reno, NV"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* RAD AI Pricing Toggle */}
              <div className={`mt-4 p-4 rounded-lg border transition-colors ${
                aiPricingEnabled 
                  ? 'bg-[#CC0000]/5 border-[#CC0000]/20' 
                  : 'bg-muted/50 border-border'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    aiPricingEnabled ? 'bg-[#CC0000]' : 'bg-muted-foreground/20'
                  }`}>
                    <Brain className={`h-5 w-5 ${aiPricingEnabled ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <Label 
                        htmlFor="aiPricing" 
                        className="text-foreground font-medium cursor-pointer flex items-center gap-2"
                      >
                        Let RAD manage my pricing
                        {aiPricingEnabled && <Sparkles className="h-4 w-4 text-[#CC0000]" />}
                      </Label>
                      <Switch
                        id="aiPricing"
                        checked={aiPricingEnabled}
                        onCheckedChange={setAiPricingEnabled}
                        disabled={isLoading}
                        className="data-[state=checked]:bg-[#CC0000]"
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aiPricingEnabled 
                        ? "RAD will monitor market demand, Tahoe events, airport traffic, seasonality, and competitor pricing to suggest or auto-adjust your daily rate on a regular basis."
                        : "Enable AI-powered dynamic pricing to maximize your earnings automatically."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-6 h-6 bg-[#CC0000] text-white rounded-full flex items-center justify-center text-sm">4</span>
                Description
              </h3>
              <Textarea
                id="description"
                placeholder="Describe your vehicle, features, and any rules for renters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model || !category}
              className="w-full h-12 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium text-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'List My Vehicle'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By listing your vehicle, you agree to our{' '}
            <Link href="/terms" className="text-[#CC0000] hover:text-[#CC0000]/80">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
