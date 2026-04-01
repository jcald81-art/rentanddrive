'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Car, ArrowLeft, Brain, Sparkles, Shield, CheckCircle2, AlertTriangle, Upload, FileText, Search, Info, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { decodeVin as decodeVinAction } from '@/app/actions/decode-vin'

type VehicleType = 'car' | 'motorcycle'

// Vehicle features options - defined outside component to maintain stable reference
const VEHICLE_FEATURES = [
  { value: 'ski_rack', label: 'Ski Rack / Roof Rack' },
  { value: 'snow_tires', label: 'Snow Tires / Winter Package' },
  { value: 'floor_mats', label: 'All-Weather Floor Mats' },
  { value: 'tow_hitch', label: 'Tow Hitch' },
  { value: 'premium_audio', label: 'Premium Audio System' },
  { value: 'leather_seats', label: 'Leather Seats' },
  { value: 'sunroof', label: 'Sunroof / Moonroof' },
  { value: 'backup_camera', label: 'Backup Camera' },
  { value: 'heated_seats', label: 'Heated Seats' },
  { value: 'navigation', label: 'Navigation System' },
  { value: 'bluetooth', label: 'Bluetooth / Apple CarPlay' },
] as const

interface DecodedVehicle {
  vin: string
  is_valid: boolean
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  body_class: string | null
  doors: number | null
  engine_cylinders: number | null
  engine_displacement_l: number | null
  fuel_type: string | null
  drive_type: string | null
  transmission: string | null
  manufacturer: string | null
  plant_country: string | null
  vehicle_type: string | null
  suggested_category: string
  is_awd: boolean
}

interface RecallData {
  total_recalls: number
  recalls: Array<{
    Component: string
    Summary: string
    Consequence: string
    Remedy: string
    NHTSACampaignNumber: string
  }>
}

export default function ListVehiclePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // VIN Decode states (FIRST STEP)
  const [vin, setVin] = useState('')
  const [isDecoding, setIsDecoding] = useState(false)
  const [vinDecoded, setVinDecoded] = useState(false)
  const [decodedData, setDecodedData] = useState<DecodedVehicle | null>(null)
  const [vinError, setVinError] = useState<string | null>(null)
  
  // Recall states
  const [isCheckingRecalls, setIsCheckingRecalls] = useState(false)
  const [recallData, setRecallData] = useState<RecallData | null>(null)
  const [recallStatus, setRecallStatus] = useState<'clear' | 'warning' | 'critical' | null>(null)

  // Vehicle info state (auto-populated from VIN or manual)
  const [vehicleType, setVehicleType] = useState<VehicleType>('car')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [trim, setTrim] = useState('')
  const [driveType, setDriveType] = useState('')
  const [engineInfo, setEngineInfo] = useState('')
  const [bodyClass, setBodyClass] = useState('')
  const [fuelType, setFuelType] = useState('')

  // Dynamic dropdown states for manual entry
  const [availableMakes, setAvailableMakes] = useState<Array<{ id: number; name: string }>>([])
  const [availableModels, setAvailableModels] = useState<Array<{ id: number; name: string }>>([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  
  const [category, setCategory] = useState('')
  const [mileage, setMileage] = useState('')
  const [mileageError, setMileageError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)
  
  // Vehicle features multi-select
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [otherFeature, setOtherFeature] = useState('')
  
  const [dailyRate, setDailyRate] = useState('')
  const [manuallyEditedRate, setManuallyEditedRate] = useState(false) // Track if user manually edited
  const [aiPricingEnabled, setAiPricingEnabled] = useState(false)
  const [aiPricingLoading, setAiPricingLoading] = useState(false)
  const [aiPriceUpdateMessage, setAiPriceUpdateMessage] = useState<string | null>(null) // Toast message
  const [aiRecommendation, setAiRecommendation] = useState<{
    rate: number
    reasoning: string
    confidence: string
    marketRange?: { low: number; high: number }
  } | null>(null)
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('Reno, NV')

  // Document upload states
  const [dlFront, setDlFront] = useState<File | null>(null)
  const [dlBack, setDlBack] = useState<File | null>(null)
  const [insurance, setInsurance] = useState<File | null>(null)
  const [insuranceVerified, setInsuranceVerified] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)

  // Generate year options (current year + 1 down to 1980)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear + 2 - 1980 }, (_, i) => currentYear + 1 - i)

  // Toggle feature selection
  const toggleFeature = (value: string) => {
    setSelectedFeatures(prev => 
      prev.includes(value) 
        ? prev.filter(f => f !== value)
        : [...prev, value]
    )
  }

  // Category options based on vehicle type
  const categoryOptions = vehicleType === 'motorcycle'
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
        { value: 'sports', label: 'Sports Car' },
        { value: 'luxury', label: 'Luxury' },
      ]

  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!mounted) return
      
      if (!user) {
        // Use window.location for initial redirect to avoid router initialization issues
        window.location.href = '/sign-in?redirect=/list-vehicle'
      } else {
        setIsAuthenticated(true)
      }
    }
    
    // Defer auth check to ensure router is initialized
    const timeoutId = setTimeout(checkAuth, 0)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Fetch makes when vehicle type changes
  useEffect(() => {
    async function fetchMakes() {
      setLoadingMakes(true)
      try {
        const res = await fetch(`/api/vehicles/makes?type=${vehicleType}`)
        if (res.ok) {
          const data = await res.json()
          // Sort makes alphabetically A-Z
          const sortedMakes = [...(data.makes || [])].sort((a: { name: string }, b: { name: string }) => 
            a.name.localeCompare(b.name)
          )
          setAvailableMakes(sortedMakes)
        }
      } catch (err) {
        console.error('Failed to fetch makes:', err)
      } finally {
        setLoadingMakes(false)
      }
    }
    
    // Only fetch if not VIN decoded (manual entry mode)
    if (!vinDecoded) {
      fetchMakes()
      // Reset make/model when vehicle type changes
      setMake('')
      setModel('')
      setAvailableModels([])
      setCategory('')
    }
  }, [vehicleType, vinDecoded])

  // Validate mileage and vehicle age
  useEffect(() => {
    // Mileage validation
    const miles = parseInt(mileage)
    if (mileage && miles > 130000) {
      setMileageError('Vehicle exceeds 130,000 mile limit')
    } else {
      setMileageError(null)
    }

    // Age validation
    const vehicleYear = parseInt(year)
    if (year && vehicleYear) {
      const vehicleAge = currentYear - vehicleYear
      if (vehicleAge > 12) {
        setAgeError('Vehicles older than 12 years require manual approval — contact support')
      } else {
        setAgeError(null)
      }
    } else {
      setAgeError(null)
    }
  }, [mileage, year, currentYear])

  // Fetch models when make or year changes
  useEffect(() => {
    async function fetchModels() {
      if (!make || vinDecoded) {
        setAvailableModels([])
        return
      }

      setLoadingModels(true)
      try {
        const params = new URLSearchParams({ make })
        if (year) {
          params.set('year', year)
        }
        params.set('type', vehicleType)
        const res = await fetch(`/api/vehicles/models?${params}`)
        if (res.ok) {
          const data = await res.json()
          // Sort models alphabetically A-Z
          const sortedModels = [...(data.models || [])].sort((a: { name: string }, b: { name: string }) => 
            a.name.localeCompare(b.name)
          )
          setAvailableModels(sortedModels)
        }
      } catch (err) {
        console.error('Failed to fetch models:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [make, year, vehicleType, vinDecoded])

  // VIN Decode function using server action
  const decodeVin = useCallback(async () => {
    if (vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters')
      return
    }

    setIsDecoding(true)
    setIsCheckingRecalls(true)
    setVinError(null)
    setDecodedData(null)
    setRecallData(null)
    setRecallStatus(null)

    try {
      // Call server action for VIN decode
      const result = await decodeVinAction(vin)
      
      if (!result.success || !result.vehicle) {
        setVinError(result.error || 'Could not decode this VIN. Please verify it is correct or enter details manually.')
        return
      }

      const decoded = result.vehicle
      setDecodedData(decoded)
      setVinDecoded(true)
      
      // Auto-populate fields from VIN decode
      setMake(decoded.make || '')
      setModel(decoded.model || '')
      setYear(decoded.year?.toString() || '')
      setTrim(decoded.trim || '')
      setDriveType(decoded.drive_type || '')
      setBodyClass(decoded.body_class || '')
      setFuelType(decoded.fuel_type || '')
      
      // Build engine info string
      if (decoded.engine_cylinders || decoded.engine_displacement_l) {
        const engineParts = []
        if (decoded.engine_cylinders) engineParts.push(`${decoded.engine_cylinders} cyl`)
        if (decoded.engine_displacement_l) engineParts.push(`${decoded.engine_displacement_l}L`)
        if (decoded.fuel_type) engineParts.push(decoded.fuel_type)
        setEngineInfo(engineParts.join(' / '))
      }
      
      // Set suggested category
      if (decoded.suggested_category) {
        setCategory(decoded.suggested_category)
      }
      
      // Determine vehicle type from body class
      if (decoded.body_class?.toLowerCase().includes('motorcycle')) {
        setVehicleType('motorcycle')
      }

      // Handle recall data from server action
      if (result.recalls) {
        setRecallData(result.recalls)
        
        // Determine recall status
        if (result.recalls.total_recalls === 0) {
          setRecallStatus('clear')
        } else if (result.recalls.recalls?.some(r => 
          r.Consequence?.toLowerCase().includes('crash') || 
          r.Consequence?.toLowerCase().includes('fire')
        )) {
          setRecallStatus('critical')
        } else {
          setRecallStatus('warning')
        }
      } else {
        setRecallStatus('clear')
      }
    } catch {
      setVinError('Failed to decode VIN. Please try again or enter details manually.')
    } finally {
      setIsDecoding(false)
      setIsCheckingRecalls(false)
    }
  }, [vin])

  // Handle VIN input change
  const handleVinChange = (value: string) => {
    // Only allow alphanumeric, uppercase, exclude I, O, Q (invalid VIN chars)
    const cleaned = value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17)
    setVin(cleaned)
    setVinError(null)
    
    // Clear previous results if VIN changed
    if (cleaned.length < 17) {
      setVinDecoded(false)
      setDecodedData(null)
      setRecallData(null)
      setRecallStatus(null)
    }
  }

  // Handle document uploads
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    verificationSetter?: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0] || null
    setter(file)
    if (file && verificationSetter) {
      setTimeout(() => verificationSetter(true), 800)
    }
  }

  // Upload documents to Supabase filing-cabinet bucket
  const uploadDocuments = async (userId: string) => {
    const supabase = createClient()
    const uploads: Promise<unknown>[] = []

    if (dlFront) {
      const dlFrontPath = `${userId}/dl-front-${Date.now()}.${dlFront.name.split('.').pop()}`
      uploads.push(supabase.storage.from('filing-cabinet').upload(dlFrontPath, dlFront))
    }
    if (dlBack) {
      const dlBackPath = `${userId}/dl-back-${Date.now()}.${dlBack.name.split('.').pop()}`
      uploads.push(supabase.storage.from('filing-cabinet').upload(dlBackPath, dlBack))
    }
    if (insurance) {
      const insurancePath = `${userId}/insurance-${Date.now()}.${insurance.name.split('.').pop()}`
      uploads.push(supabase.storage.from('filing-cabinet').upload(insurancePath, insurance))
    }

    await Promise.all(uploads)
  }

  // Fetch AI pricing recommendation when toggle is enabled and vehicle info is complete
  useEffect(() => {
    async function fetchAiPricing() {
      if (!aiPricingEnabled) {
        setAiRecommendation(null)
        // Don't clear daily rate when disabling - let user keep their value
        return
      }

      if (!make || !model || !year) {
        return
      }

      // Don't fetch if there are validation errors
      if (mileageError || ageError) {
        return
      }

      setAiPricingLoading(true)
      try {
        // Get feature labels for the selected features
        const featureLabels = selectedFeatures
          .map(f => VEHICLE_FEATURES.find(vf => vf.value === f)?.label)
          .filter(Boolean)
        if (otherFeature.trim()) {
          featureLabels.push(otherFeature.trim())
        }

        const res = await fetch('/api/vehicles/ai-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            make,
            model,
            year,
            category,
            vehicleType,
            location,
            driveType,
            trim,
            mileage: mileage ? parseInt(mileage) : null,
            features: featureLabels,
            description: description || null,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const newRate = data.recommendedRate
          const currentRate = parseFloat(dailyRate) || 0
          const priceDiff = Math.abs(newRate - currentRate)
          
          // Update recommendation always (for display purposes)
          setAiRecommendation({
            rate: newRate,
            reasoning: data.reasoning,
            confidence: data.confidence,
            marketRange: data.marketRange,
          })
          
          // Only auto-update daily rate if:
          // 1. User hasn't manually edited the rate, AND
          // 2. Either no rate set OR price difference is $5 or more
          if (!manuallyEditedRate && (currentRate === 0 || priceDiff >= 5)) {
            setDailyRate(String(newRate))
            
            // Show toast only if rate was updated (not first time)
            if (currentRate > 0 && priceDiff >= 5) {
              setAiPriceUpdateMessage(`RAD updated price to $${newRate}/day based on your changes.`)
              // Auto-dismiss after 4 seconds
              setTimeout(() => setAiPriceUpdateMessage(null), 4000)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI pricing:', err)
      } finally {
        setAiPricingLoading(false)
      }
    }

    // Debounce the AI pricing call (800ms for smoother experience)
    const debounce = setTimeout(fetchAiPricing, 800)
    return () => clearTimeout(debounce)
  }, [aiPricingEnabled, make, model, year, category, vehicleType, location, driveType, trim, mileage, selectedFeatures, otherFeature, description, mileageError, ageError, dailyRate, manuallyEditedRate])

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
      if (!year || !make || !model) {
        throw new Error('Please enter year, make, and model')
      }
      if (!mileage) {
        throw new Error('Please enter vehicle mileage')
      }
      if (mileageError) {
        throw new Error(mileageError)
      }
      if (ageError) {
        throw new Error(ageError)
      }
      if (!category) {
        throw new Error('Please select a category')
      }
      if (!dailyRate || parseFloat(dailyRate) <= 0) {
        throw new Error('Please enter a valid daily rate')
      }

      // Validate required documents
      if (!dlFront || !dlBack) {
        throw new Error('Please upload both front and back of your Driver\'s License')
      }
      if (!insurance) {
        throw new Error('Please upload your proof of insurance')
      }

      // Check for critical recalls
      if (recallStatus === 'critical') {
        throw new Error('Vehicle has critical safety recalls that must be resolved before listing')
      }

      // Upload documents
      setUploadingDocs(true)
      await uploadDocuments(user.id)
      setUploadingDocs(false)

      // Prepare features array
      const allFeatures = [...selectedFeatures]
      if (otherFeature.trim()) {
        allFeatures.push(`other:${otherFeature.trim()}`)
      }

      const { data: vehicleData, error: insertError } = await supabase
        .from('vehicles')
        .insert({
          host_id: user.id,
          make,
          model,
          year: parseInt(year),
          trim: trim || null,
          category,
          vehicle_type: vehicleType,
          daily_rate: parseFloat(dailyRate),
          ai_pricing_enabled: aiPricingEnabled,
          description,
          location,
          vin: vin || null,
          drive_type: driveType || null,
          body_class: bodyClass || null,
          fuel_type: fuelType || null,
          engine_info: engineInfo || null,
          mileage: parseInt(mileage),
          features: allFeatures,
          recall_status: recallStatus === 'clear' ? 'clear' : recallStatus === 'warning' ? 'warning' : 'unchecked',
          recall_checked_at: recallStatus ? new Date().toISOString() : null,
          status: 'pending_photos'
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      
      // Redirect to RAD Photo Session with the new vehicle ID
      router.push(`/host/vehicles/${vehicleData?.id}/photos?new=true`)
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
            {/* STEP 1: VIN DECODE - MOST IMPORTANT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#CC0000] text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#CC0000]" />
                    Quick Start with VIN
                  </h3>
                  <p className="text-sm text-muted-foreground">Decode your VIN to auto-fill vehicle details</p>
                </div>
              </div>

              {/* Vehicle Type Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    vehicleType === 'car'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Car className="h-4 w-4 inline-block mr-2" />
                  Car / SUV / Truck
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    vehicleType === 'motorcycle'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <svg className="h-4 w-4 inline-block mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    <path d="M19 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    <path d="M10 16h4"/>
                    <path d="M6 13l3-4 4-1 2 2h4"/>
                  </svg>
                  Motorcycle
                </button>
              </div>

              <Card className="border-[#CC0000]/20 bg-[#CC0000]/5">
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter 17-character VIN"
                        value={vin}
                        onChange={(e) => handleVinChange(e.target.value)}
                        className="pr-16 font-mono tracking-wider uppercase text-lg h-12"
                        maxLength={17}
                        disabled={isDecoding}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                        {vin.length}/17
                      </span>
                    </div>
                    <Button 
                      type="button"
                      onClick={decodeVin}
                      disabled={vin.length !== 17 || isDecoding}
                      className="h-12 px-6 bg-[#CC0000] hover:bg-[#CC0000]/90"
                    >
                      {isDecoding ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-2" />
                          Decode
                        </>
                      )}
                    </Button>
                  </div>

                  {vinError && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {vinError}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    VIN is typically found on your registration, insurance card, or driver-side dashboard
                  </p>
                </CardContent>
              </Card>

              {/* Decoded Vehicle Info */}
              {vinDecoded && decodedData && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Vehicle Decoded Successfully
                      </CardTitle>
                      {isCheckingRecalls && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Checking recalls...
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Year</p>
                        <p className="font-semibold text-lg">{decodedData.year}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Make</p>
                        <p className="font-semibold text-lg">{decodedData.make}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="font-semibold text-lg">{decodedData.model}</p>
                      </div>
                      {decodedData.trim && (
                        <div>
                          <p className="text-xs text-muted-foreground">Trim</p>
                          <p className="font-medium">{decodedData.trim}</p>
                        </div>
                      )}
                      {decodedData.body_class && (
                        <div>
                          <p className="text-xs text-muted-foreground">Body Style</p>
                          <p className="font-medium">{decodedData.body_class}</p>
                        </div>
                      )}
                      {decodedData.drive_type && (
                        <div>
                          <p className="text-xs text-muted-foreground">Drivetrain</p>
                          <p className="font-medium flex items-center gap-1">
                            {decodedData.drive_type}
                            {decodedData.is_awd && (
                              <Badge variant="secondary" className="text-xs">AWD</Badge>
                            )}
                          </p>
                        </div>
                      )}
                      {decodedData.engine_cylinders && (
                        <div>
                          <p className="text-xs text-muted-foreground">Engine</p>
                          <p className="font-medium">
                            {decodedData.engine_cylinders} cyl 
                            {decodedData.engine_displacement_l && ` / ${decodedData.engine_displacement_l}L`}
                          </p>
                        </div>
                      )}
                      {decodedData.fuel_type && (
                        <div>
                          <p className="text-xs text-muted-foreground">Fuel Type</p>
                          <p className="font-medium">{decodedData.fuel_type}</p>
                        </div>
                      )}
                      {decodedData.plant_country && (
                        <div>
                          <p className="text-xs text-muted-foreground">Made In</p>
                          <p className="font-medium">{decodedData.plant_country}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recall Status Card */}
              {recallStatus && !isCheckingRecalls && (
                <Card className={`${
                  recallStatus === 'clear' 
                    ? 'border-green-200 bg-green-50/50' 
                    : recallStatus === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : 'border-amber-200 bg-amber-50/50'
                }`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {recallStatus === 'clear' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${
                          recallStatus === 'critical' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                      )}
                      <div>
                        <p className={`font-semibold ${
                          recallStatus === 'clear' ? 'text-green-700' 
                          : recallStatus === 'critical' ? 'text-red-700' 
                          : 'text-amber-700'
                        }`}>
                          {recallStatus === 'clear' 
                            ? 'No Open Recalls Found' 
                            : recallStatus === 'critical'
                            ? `${recallData?.total_recalls || 0} Critical Recall(s) Found`
                            : `${recallData?.total_recalls || 0} Recall(s) Found`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recallStatus === 'clear' 
                            ? 'This vehicle has passed the NHTSA safety recall check.'
                            : recallStatus === 'critical'
                            ? 'Critical safety recalls must be resolved at an authorized dealership before listing.'
                            : 'We recommend getting these recalls fixed at an authorized dealership (free of charge).'
                          }
                        </p>
                        {recallData && recallData.total_recalls > 0 && (
                          <div className="mt-3 space-y-2">
                            {recallData.recalls.slice(0, 2).map((recall, idx) => (
                              <div key={idx} className="text-xs bg-white/60 p-2 rounded border">
                                <p className="font-medium">{recall.Component}</p>
                                <p className="text-muted-foreground mt-1 line-clamp-2">{recall.Summary}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* STEP 2: Vehicle Details (Manual entry or edit decoded values) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#CC0000] text-white rounded-full flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {vinDecoded ? 'Confirm Vehicle Details' : 'Vehicle Details'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Year Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  {vinDecoded ? (
                    <Input
                      id="year"
                      value={year}
                      onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      disabled={isLoading}
                    />
                  ) : (
                    <Select value={year} onValueChange={(val) => { setYear(val); setModel(''); }} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(y => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Make Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  {vinDecoded ? (
                    <Input
                      id="make"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      disabled={isLoading}
                    />
                  ) : (
                    <Select value={make} onValueChange={(val) => { setMake(val); setModel(''); }} disabled={isLoading || loadingMakes}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMakes ? 'Loading...' : 'Select make'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMakes.map(m => (
                          <SelectItem key={m.id} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Model Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  {vinDecoded ? (
                    <Input
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={isLoading}
                    />
                  ) : (
                    <Select value={model} onValueChange={setModel} disabled={isLoading || loadingModels || !make}>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !make ? 'Select make first' : 
                          loadingModels ? 'Loading...' : 
                          'Select model'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map(m => (
                          <SelectItem key={m.id} value={m.name}>
                            {m.name}
                          </SelectItem>
                        ))}
                        {availableModels.length === 0 && make && !loadingModels && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No models found - type manually below
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {/* Manual model entry fallback */}
                  {!vinDecoded && availableModels.length === 0 && make && !loadingModels && (
                    <Input
                      placeholder="Or type model name..."
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-2"
                      disabled={isLoading}
                    />
                  )}
                </div>
              </div>

              {/* Additional decoded fields */}
              {(trim || driveType || engineInfo || bodyClass) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trim && (
                    <div className="space-y-2">
                      <Label htmlFor="trim">Trim</Label>
                      <Input
                        id="trim"
                        value={trim}
                        onChange={(e) => setTrim(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  {driveType && (
                    <div className="space-y-2">
                      <Label htmlFor="driveType">Drivetrain</Label>
                      <Input
                        id="driveType"
                        value={driveType}
                        onChange={(e) => setDriveType(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  {engineInfo && (
                    <div className="space-y-2">
                      <Label htmlFor="engine">Engine</Label>
                      <Input
                        id="engine"
                        value={engineInfo}
                        onChange={(e) => setEngineInfo(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  {bodyClass && (
                    <div className="space-y-2">
                      <Label htmlFor="bodyClass">Body Style</Label>
                      <Input
                        id="bodyClass"
                        value={bodyClass}
                        onChange={(e) => setBodyClass(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mileage and Category row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mileage */}
                <div className="space-y-2">
                  <Label htmlFor="mileage">Current Mileage *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="e.g., 45000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value.replace(/\D/g, ''))}
                    required
                    min="0"
                    max="130000"
                    disabled={isLoading}
                    className={mileageError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {mileageError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {mileageError}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category *</Label>
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
                  {decodedData?.suggested_category && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Suggested based on VIN decode
                    </p>
                  )}
                </div>
              </div>

              {/* Age Error Alert */}
              {ageError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Vehicle Age Restriction</p>
                      <p className="text-sm">{ageError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Features Multi-select */}
              <div className="space-y-3">
                <Label>Vehicle Features</Label>
                <p className="text-xs text-muted-foreground -mt-1">Select features that may increase rental value</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {VEHICLE_FEATURES.map(feature => (
                    <button
                      key={feature.value}
                      type="button"
                      onClick={() => toggleFeature(feature.value)}
                      disabled={isLoading}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors text-left ${
                        selectedFeatures.includes(feature.value)
                          ? 'bg-[#CC0000] text-white border-[#CC0000]'
                          : 'bg-background border-border hover:border-[#CC0000]/50 text-foreground'
                      }`}
                    >
                      {feature.label}
                    </button>
                  ))}
                </div>
                {/* Other feature input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Other feature (optional)"
                    value={otherFeature}
                    onChange={(e) => setOtherFeature(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                </div>
                {selectedFeatures.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                    {otherFeature.trim() ? ` + "${otherFeature.trim()}"` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* STEP 3: Pricing & Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#CC0000] text-white rounded-full flex items-center justify-center font-bold">3</div>
                <h3 className="text-lg font-semibold text-foreground">Pricing & Location</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                  <div className="relative">
                    <Input
                      id="dailyRate"
                      type="number"
                      placeholder="e.g., 75"
                      value={dailyRate}
                      onChange={(e) => {
                        setDailyRate(e.target.value)
                        // Mark as manually edited if AI pricing is on and user changes value
                        if (aiPricingEnabled && e.target.value !== String(aiRecommendation?.rate)) {
                          setManuallyEditedRate(true)
                        }
                      }}
                      required
                      min="1"
                      disabled={isLoading || aiPricingLoading}
                    />
                    {aiPricingLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#CC0000]" />
                      </div>
                    )}
                  </div>
                  
                  {/* AI Recommendation */}
                  {aiRecommendation && aiPricingEnabled && (
                    <div className="mt-3 p-3 bg-[#CC0000]/5 border border-[#CC0000]/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#CC0000] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            RAD recommends ${aiRecommendation.rate}/day
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {aiRecommendation.reasoning}
                          </p>
                          {aiRecommendation.marketRange && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Market range: ${aiRecommendation.marketRange.low} - ${aiRecommendation.marketRange.high}/day
                            </p>
                          )}
                          <p className="text-xs text-[#CC0000] mt-2">
                            You can still adjust manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {aiPricingLoading && (
                    <div className="mt-3 p-3 bg-muted/50 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[#CC0000]" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Analyzing market data...</p>
                          <p className="text-xs text-muted-foreground">RAD is checking Reno/Tahoe demand and similar listings</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Price Update Toast */}
                  {aiPriceUpdateMessage && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">{aiPriceUpdateMessage}</p>
                        <button 
                          onClick={() => setAiPriceUpdateMessage(null)}
                          className="ml-auto text-green-600 hover:text-green-700"
                        >
                          <span className="sr-only">Dismiss</span>
                          &times;
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual edit notice */}
                  {aiPricingEnabled && manuallyEditedRate && (
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      You&apos;ve set a custom rate. Toggle AI pricing off and on to get a new recommendation.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
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
              <div className={`p-4 rounded-lg border transition-colors ${
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
                        onCheckedChange={(checked) => {
                          setAiPricingEnabled(checked)
                          // Reset manual edit flag when turning on AI pricing
                          if (checked) {
                            setManuallyEditedRate(false)
                          }
                        }}
                        disabled={isLoading}
                        className="data-[state=checked]:bg-[#CC0000]"
                      />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {aiPricingEnabled 
                        ? "RAD will analyze market demand, Tahoe events, airport traffic, and competitor pricing to set your optimal rate."
                        : "Enable AI-powered dynamic pricing to maximize your earnings automatically."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: Safety Documents */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#CC0000] text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety Verification
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Required documents to protect you and renters. All documents are securely stored.
              </p>

              {/* Driver's License Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver&apos;s License (Front)</Label>
                  <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dlFront ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setDlFront)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isLoading}
                    />
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      {dlFront ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-medium text-green-700 truncate max-w-full">{dlFront.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload front of DL</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Driver&apos;s License (Back)</Label>
                  <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dlBack ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setDlBack)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isLoading}
                    />
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      {dlBack ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-medium text-green-700 truncate max-w-full">{dlBack.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload back of DL</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {dlFront && dlBack && (
                <Card className="p-3 bg-green-500/10 border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-700">
                      Driver&apos;s License verified - proceeding to next step.
                    </p>
                  </div>
                </Card>
              )}

              {/* Insurance Upload */}
              <div className="space-y-2">
                <Label>Proof of Insurance</Label>
                <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                  insurance ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                }`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, setInsurance, setInsuranceVerified)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 text-center py-2">
                    {insurance ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <p className="text-sm font-medium text-green-700 truncate max-w-full">{insurance.name}</p>
                      </>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload insurance card or policy</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {insuranceVerified && (
                <Card className="p-3 bg-green-500/10 border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-700">
                      Insurance verified - minimum coverage met.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* STEP 5: Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#CC0000] text-white rounded-full flex items-center justify-center font-bold">5</div>
                <h3 className="text-lg font-semibold text-foreground">Description</h3>
              </div>
              <Textarea
                placeholder="Describe your vehicle: special features, condition, rental guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || uploadingDocs || !year || !make || !model || !category || !dlFront || !dlBack || !insurance || recallStatus === 'critical'}
              className="w-full h-12 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium text-lg disabled:opacity-50"
            >
              {isLoading || uploadingDocs ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {uploadingDocs ? 'Uploading Documents...' : 'Submitting...'}
                </>
              ) : (
                'Continue to Photo Session'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              After listing, you&apos;ll be guided through the RAD Photo Session to capture professional images of your vehicle.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
