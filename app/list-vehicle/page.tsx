// CACHE-BUST-2026-04-01-SYNTAX-FIX-FINAL
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Car, ArrowLeft, Brain, Sparkles, Shield, CheckCircle2, AlertTriangle, Upload, FileText, Search, Info, Zap, Smartphone, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { SafetyStandards } from '@/components/safety-standards'
import { StripePayoutSetup } from '@/components/stripe-payout-setup'
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
  const [apiErrors, setApiErrors] = useState<string[]>([])
  const [debugMode, setDebugMode] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  
  // Track component mount state to prevent router actions before hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Initialize debug mode from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDebug = localStorage.getItem('radcc_debug') === 'true'
      setDebugMode(savedDebug)
    }
  }, [])
  
  // Multi-step flow: 'form' -> 'safety' -> 'payouts' -> 'photos'
  const [flowStep, setFlowStep] = useState<'form' | 'safety' | 'payouts' | 'complete'>('form')
  const [vehicleId, setVehicleId] = useState<string | null>(null)

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
  
  // AI Document validation states with extracted data
  const [dlValidation, setDlValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'concerns'
    message: string
    extractedData?: {
      name?: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      licenseNumber?: string
      issueDate?: string
      expirationDate?: string
      dateOfBirth?: string
      issuingState?: string
    } | null
    analysis?: {
      isExpired?: boolean | null
      isReadable?: boolean
      appearsGenuine?: boolean
      tamperingIndicators?: string[]
    } | null
    concerns?: string[]
  }>({ status: 'idle', message: '' })
  
  const [insuranceValidation, setInsuranceValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'concerns'
    message: string
    extractedData?: {
      policyNumber?: string
      insurerName?: string
      effectiveDate?: string
      expirationDate?: string
      insuredName?: string
      vehicleYear?: string
      vehicleMake?: string
      vehicleModel?: string
      vehicleVin?: string
      coverageTypes?: string[]
    } | null
    analysis?: {
      isExpired?: boolean | null
      isReadable?: boolean
      appearsGenuine?: boolean
      vehicleMatch?: 'match' | 'mismatch' | 'unknown'
      vehicleMatchDetails?: string
    } | null
    concerns?: string[]
  }>({ status: 'idle', message: '' })
  
  // QR Code state for mobile upload
  const [showQrModal, setShowQrModal] = useState(false)
  const [mobileUploadSessionId] = useState(() => 
    typeof window !== 'undefined' 
      ? `rad-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : ''
  )

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
      const url = `/api/vehicles/makes?type=${vehicleType}`
      console.log('🔍 [RADCC DEBUG] Fetching makes:', url)
      try {
        const res = await fetch(url)
        console.log('📥 [RADCC DEBUG] Makes response:', res.status)
        if (res.ok) {
          const data = await res.json()
          // Sort makes alphabetically A-Z
          const sortedMakes = [...(data.makes || [])].sort((a: { name: string }, b: { name: string }) => 
            a.name.localeCompare(b.name)
          )
          setAvailableMakes(sortedMakes)
        } else {
          const text = await res.text()
          console.error('❌ [RADCC DEBUG] Makes error:', res.status, text.substring(0, 200))
        }
      } catch (err) {
        console.error('❌ [RADCC DEBUG] Failed to fetch makes:', err)
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
      const params = new URLSearchParams({ make })
      if (year) {
        params.set('year', year)
      }
      params.set('type', vehicleType)
      const url = `/api/vehicles/models?${params}`
      console.log('🔍 [RADCC DEBUG] Fetching models:', url)
      try {
        const res = await fetch(url)
        console.log('📥 [RADCC DEBUG] Models response:', res.status)
        if (res.ok) {
          const data = await res.json()
          // Sort models alphabetically A-Z
          const sortedModels = [...(data.models || [])].sort((a: { name: string }, b: { name: string }) => 
            a.name.localeCompare(b.name)
          )
          setAvailableModels(sortedModels)
        } else {
          const text = await res.text()
          console.error('❌ [RADCC DEBUG] Models error:', res.status, text.substring(0, 200))
        }
      } catch (err) {
        console.error('❌ [RADCC DEBUG] Failed to fetch models:', err)
      } finally {
        setLoadingModels(false)
      }
    }
    fetchModels()
  }, [make, year, vehicleType, vinDecoded])

  // Handle VIN input change with auto-decode
  const handleVinChange = async (value: string) => {
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
    
    // Auto-decode when VIN reaches exactly 17 characters
    if (cleaned.length === 17 && !isDecoding) {
      // Trigger decode with the new VIN value directly
      setIsDecoding(true)
      setIsCheckingRecalls(true)
      setVinError(null)
      setDecodedData(null)
      setRecallData(null)
      setRecallStatus(null)

      try {
        const result = await decodeVinAction(cleaned)
        
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
          } else if (result.recalls.recalls?.some((r: { Consequence?: string }) => 
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
      } catch (err) {
        console.error('VIN decode failed:', err)
        setVinError('Failed to decode VIN. Please try again.')
      } finally {
        setIsDecoding(false)
        setIsCheckingRecalls(false)
      }
    }
  }

  // Handle document uploads with AI validation
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
    docType?: 'dl_front' | 'dl_back' | 'insurance'
  ) => {
    const file = e.target.files?.[0] || null
    setter(file)
    
    // Trigger AI validation for documents
    if (file && docType) {
      if (docType === 'dl_front' || docType === 'dl_back') {
        // Validate license when both front and back are uploaded
        if (docType === 'dl_front') {
          // Wait for potential back upload, or validate front alone after delay
          setTimeout(() => {
            if (dlBack) {
              validateDocument(file, 'license')
            }
          }, 500)
        } else if (docType === 'dl_back' && dlFront) {
          validateDocument(dlFront, 'license')
        }
      } else if (docType === 'insurance') {
        validateDocument(file, 'insurance')
      }
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

  // Manual AI pricing request - only triggered by button click
  const fetchAiPricing = async () => {
    if (!make || !model || !year) {
      setAiPriceUpdateMessage('Please enter vehicle make, model, and year first.')
      setTimeout(() => setAiPriceUpdateMessage(null), 3000)
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

      console.log('🔍 [RADCC DEBUG] Fetching AI pricing...')
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
      console.log('📥 [RADCC DEBUG] AI pricing response:', res.status)

      if (res.ok) {
        const data = await res.json()
        const newRate = data.recommendedRate
        
        setAiRecommendation({
          rate: newRate,
          reasoning: data.reasoning,
          confidence: data.confidence,
          marketRange: data.marketRange,
        })
        
        // Update daily rate with recommendation
        setDailyRate(String(newRate))
        setAiPriceUpdateMessage(`RAD recommends $${newRate}/day based on your vehicle details.`)
        setTimeout(() => setAiPriceUpdateMessage(null), 4000)
      } else {
        const text = await res.text()
        console.error('❌ [RADCC DEBUG] AI pricing error:', res.status, text.substring(0, 200))
      }
    } catch (err) {
      console.error('❌ [RADCC DEBUG] Failed to fetch AI pricing:', err)
      setAiPriceUpdateMessage('Failed to get price recommendation. Please try again.')
      setTimeout(() => setAiPriceUpdateMessage(null), 3000)
    } finally {
      setAiPricingLoading(false)
    }
  }

  // AI Document validation function with field extraction
  const validateDocument = async (file: File, docType: 'license' | 'insurance') => {
    const setValidation = docType === 'license' ? setDlValidation : setInsuranceValidation
    setValidation({ status: 'validating', message: 'RAD AI is analyzing your document...' })
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', docType)
      if (docType === 'insurance' && make && model && year) {
        formData.append('vehicleInfo', JSON.stringify({ make, model, year }))
      }
      
      console.log('🔍 [RADCC DEBUG] Validating document:', docType)
      const res = await fetch('/api/documents/validate', {
        method: 'POST',
        body: formData,
      })
      console.log('📥 [RADCC DEBUG] Document validation response:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        
        if (data.valid) {
          setValidation({ 
            status: 'valid', 
            message: data.message || 'Document looks valid',
            extractedData: data.extractedData,
            analysis: data.analysis,
            concerns: data.concerns
          })
          if (docType === 'insurance') setInsuranceVerified(true)
          
          // Auto-populate location from DL if available and not already set
          if (docType === 'license' && data.extractedData) {
            const dlData = data.extractedData
            if (dlData.city && dlData.state && location === 'Reno, NV') {
              setLocation(`${dlData.city}, ${dlData.state}`)
            }
          }
        } else {
          setValidation({ 
            status: 'concerns', 
            message: data.message || 'Concerns detected - please review',
            extractedData: data.extractedData,
            analysis: data.analysis,
            concerns: data.concerns
          })
        }
      } else {
        const text = await res.text()
        console.error('❌ [RADCC DEBUG] Document validation error:', res.status, text.substring(0, 200))
        setValidation({ status: 'concerns', message: 'Could not validate - please ensure image is clear' })
      }
    } catch (err) {
      console.error('❌ [RADCC DEBUG] Document validation failed:', err)
      setValidation({ status: 'concerns', message: 'Validation failed - please retry' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log('🚀 [RADCC VEHICLE SUBMIT DEBUG] Starting submit – FormData keys:', {
      year, make, model, trim, category, vehicleType, dailyRate, description, location, mileage, vin, driveType, bodyClass, fuelType, engineInfo, recallStatus,
      selectedFeatures: selectedFeatures.length,
      otherFeature: otherFeature ? 'set' : 'empty',
      dlFront: dlFront ? 'set' : 'missing',
      dlBack: dlBack ? 'set' : 'missing',
      insurance: insurance ? 'set' : 'missing',
      aiPricingEnabled,
    })

    try {
      const supabase = createClient()
      console.log('🔍 [RADCC VEHICLE SUBMIT DEBUG] Getting authenticated user...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Auth error:', authError)
      }
      console.log('👤 [RADCC VEHICLE SUBMIT DEBUG] User:', user ? { id: user.id, email: user.email } : 'NOT AUTHENTICATED')
      
      if (!user) {
        console.log('⚠️ [RADCC VEHICLE SUBMIT DEBUG] No user, redirecting to sign-in')
        if (isMounted) router.push('/sign-in?redirect=/list-vehicle')
        return
      }

      // Validate required fields
      if (!year || !make || !model) {
        console.log('⚠️ [RADCC VEHICLE SUBMIT DEBUG] Missing year/make/model')
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

      console.log('📤 [RADCC VEHICLE SUBMIT DEBUG] Preparing Supabase insert...')
      
      // Map features to both individual flags AND the new features JSONB column
      const featureFlags = {
        has_ski_rack: allFeatures.includes('Ski Rack'),
        has_bike_rack: allFeatures.includes('Bike Rack'),
        has_tow_hitch: allFeatures.includes('Tow Hitch'),
        has_roof_box: allFeatures.includes('Roof Box'),
        pet_friendly: allFeatures.includes('Pet Friendly'),
        is_awd: driveType === 'AWD' || driveType === '4WD',
      }
      
      // Build insert payload with all available columns (new columns added via migration)
      const insertPayload = {
        host_id: user.id,
        make,
        model,
        year: parseInt(year),
        category: category || 'car',
        daily_rate: Math.round(parseFloat(dailyRate) * 100), // Store as cents
        description: description || null,
        location_city: location || 'Reno',
        location_state: 'NV',
        vin: vin || null,
        fuel_type: fuelType?.toLowerCase() || 'gasoline',
        mileage_limit: parseInt(mileage) || 200,
        // NEW COLUMNS from migration
        trim: trim || null,
        body_class: bodyClass || null,
        drivetrain: driveType || null,
        engine_info: engineInfo || null,
        vehicle_type: vehicleType || 'car',
        mileage: mileage ? parseInt(mileage) : null,
        features: allFeatures, // JSONB array of feature strings
        ai_pricing_enabled: aiPricingEnabled,
        // Recall tracking
        recall_severity: recallStatus === 'critical' ? 'CRITICAL' : recallStatus === 'warning' ? 'WARNING' : null,
        last_recall_check: recallStatus ? new Date().toISOString() : null,
        has_open_recalls: recallStatus === 'critical' || recallStatus === 'warning',
        status: 'pending',
        // Feature flags that exist in schema
        ...featureFlags
      }
      console.log('📋 [RADCC VEHICLE SUBMIT DEBUG] Insert payload:', JSON.stringify(insertPayload, null, 2))
      console.log('📤 [RADCC VEHICLE SUBMIT DEBUG] Inserting to Supabase vehicles table...')
      
      const { data: vehicleData, error: insertError } = await supabase
        .from('vehicles')
        .insert(insertPayload)
        .select('id')
        .single()

      console.log('📥 [RADCC VEHICLE SUBMIT DEBUG] Supabase response:', { data: vehicleData, error: insertError })
      
      if (insertError) {
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Supabase Error:', insertError)
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        })
        throw insertError
      }
      console.log('✅ [RADCC VEHICLE SUBMIT DEBUG] Vehicle created successfully:', vehicleData)
      
      // Save vehicle ID and move to safety standards step
      setVehicleId(vehicleData?.id || null)
      setFlowStep('safety')
    } catch (err: unknown) {
      console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Caught error:', err)
      console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error type:', typeof err)
      // Try to stringify the full error object
      try {
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error JSON:', JSON.stringify(err, null, 2))
      } catch {
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error not serializable')
      }
      if (err instanceof Error) {
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error message:', err.message)
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Error stack:', err.stack)
      }
      // Check if it's a Supabase error object
      if (err && typeof err === 'object' && 'message' in err) {
        const supaErr = err as { message?: string; code?: string; details?: string; hint?: string }
        console.error('❌ [RADCC VEHICLE SUBMIT DEBUG] Supabase error details:', {
          message: supaErr.message,
          code: supaErr.code,
          details: supaErr.details,
          hint: supaErr.hint
        })
        setError(supaErr.message || 'Database error')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to list vehicle')
      }
    } finally {
      console.log('🏁 [RADCC VEHICLE SUBMIT DEBUG] Submit complete (finally block)')
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
        {/* API Error Banner */}
        {apiErrors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">API Errors Detected</h3>
                <ul className="mt-2 text-sm text-red-700 space-y-1">
                  {apiErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
                <button 
                  onClick={() => setApiErrors([])}
                  className="mt-2 text-xs text-red-600 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Mode Toggle */}
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Debug Mode</span>
          <Switch
            checked={debugMode}
            onCheckedChange={(checked) => {
              setDebugMode(checked)
              if (typeof window !== 'undefined') {
                if (checked) {
                  localStorage.setItem('radcc_debug', 'true')
                  console.log('🔧 [RADCC] Debug mode ENABLED')
                } else {
                  localStorage.removeItem('radcc_debug')
                  console.log('🔧 [RADCC] Debug mode DISABLED')
                }
              }
            }}
          />
        </div>

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
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6 mb-2">
            {[
              { step: 'form', label: 'Vehicle Info' },
              { step: 'safety', label: 'Safety Standards' },
              { step: 'payouts', label: 'Payouts' },
              { step: 'complete', label: 'Photos' },
            ].map((item, idx, arr) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  flowStep === item.step ? 'text-[#CC0000]' : 
                  arr.findIndex(i => i.step === flowStep) > idx ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    flowStep === item.step ? 'bg-[#CC0000] text-white' : 
                    arr.findIndex(i => i.step === flowStep) > idx ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {arr.findIndex(i => i.step === flowStep) > idx ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{item.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
                    arr.findIndex(i => i.step === flowStep) > idx ? 'bg-green-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Safety Standards Step */}
        {flowStep === 'safety' && (
          <SafetyStandards 
            onAgree={() => setFlowStep('payouts')}
            onBack={() => setFlowStep('form')}
            isLoading={isLoading}
          />
        )}

        {/* Payouts Setup Step */}
        {flowStep === 'payouts' && (
          <StripePayoutSetup 
            onComplete={() => {
              // Redirect to photo session
              if (vehicleId && isMounted) {
                router.push(`/host/vehicles/${vehicleId}/photos?new=true`)
              } else {
                setFlowStep('complete')
              }
            }}
            onSkip={() => {
              // Allow skipping payouts but still proceed
              if (vehicleId && isMounted) {
                router.push(`/host/vehicles/${vehicleId}/photos?new=true`)
              } else {
                setFlowStep('complete')
              }
            }}
            onBack={() => setFlowStep('safety')}
            isLoading={isLoading}
          />
        )}

        {/* Vehicle Form Step */}
        {flowStep === 'form' && (
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
                  <div className="relative">
                    <Input
                      placeholder="Enter 17-character VIN"
                      value={vin}
                      onChange={(e) => handleVinChange(e.target.value)}
                      className="pr-24 font-mono tracking-wider uppercase text-lg h-12"
                      maxLength={17}
                      disabled={isDecoding}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isDecoding ? (
                        <div className="flex items-center gap-2 text-[#CC0000]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs font-medium">Decoding...</span>
                        </div>
                      ) : vin.length === 17 && vinDecoded ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-sm text-muted-foreground font-mono">
                          {vin.length}/17
                        </span>
                      )}
                    </div>
                  </div>

                  {vinError && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {vinError}
                    </div>
                  )}

                  {isDecoding && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-[#CC0000] bg-[#CC0000]/10 p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                      <span>Decoding VIN and checking for recalls...</span>
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
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="dailyRate"
                        type="number"
                        placeholder="e.g., 75"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchAiPricing}
                      disabled={isLoading || aiPricingLoading || !make || !model || !year}
                      className="border-[#CC0000]/30 text-[#CC0000] hover:bg-[#CC0000]/10 whitespace-nowrap"
                    >
                      {aiPricingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Get RAD Price
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* AI Recommendation */}
                  {aiRecommendation && (
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
                            Click &quot;Get RAD Price&quot; again anytime to refresh.
                          </p>
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

              {/* RAD AI Dynamic Pricing Toggle */}
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
                        Enable dynamic pricing after listing
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
                        ? "After listing, RAD will automatically adjust your price based on demand, events, and competitor pricing."
                        : "Enable to let RAD optimize your pricing automatically after your vehicle is listed."
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

              {/* QR Code for Mobile Upload */}
              <Card className="bg-gradient-to-br from-[#CC0000]/10 to-transparent border-[#CC0000]/30">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div 
                      className="bg-white p-3 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
                      onClick={() => setShowQrModal(true)}
                    >
                      <QRCodeSVG 
                        value={typeof window !== 'undefined' ? `${window.location.origin}/host/mobile-upload?session=${mobileUploadSessionId}` : 'https://rentanddrive.com'} 
                        size={100}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                        <Smartphone className="w-5 h-5 text-[#CC0000]" />
                        <span className="text-sm font-semibold text-[#CC0000]">Recommended: Phone Upload</span>
                      </div>
                      <p className="text-sm text-foreground font-medium mb-1">
                        Scan with your phone to upload DL, insurance, and vehicle photos easily.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Higher quality photos. Instant sync back to this form.
                      </p>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowQrModal(true)}
                      className="border-[#CC0000]/30 text-[#CC0000] hover:bg-[#CC0000]/10 flex-shrink-0"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Enlarge
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Modal */}
              {showQrModal && (
                <div 
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowQrModal(false)}
                >
                  <div 
                    className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Scan with Your Phone</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Open your phone camera and point it at this QR code to upload documents with better quality.
                    </p>
                    <div className="flex justify-center mb-4">
                      <QRCodeSVG 
                        value={typeof window !== 'undefined' ? `${window.location.origin}/host/mobile-upload?session=${mobileUploadSessionId}` : 'https://rentanddrive.com'} 
                        size={200}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="space-y-2 text-left mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Take photos of DL (front & back) and insurance</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Add vehicle photos directly from your camera</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Documents sync automatically to this form</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setShowQrModal(false)} 
                      className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or upload from this device</span>
                </div>
              </div>

              {/* Driver's License Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver&apos;s License (Front) <span className="text-red-500">*</span></Label>
                  <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dlFront ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setDlFront, 'dl_front')}
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
                  <Label>Driver&apos;s License (Back) <span className="text-red-500">*</span></Label>
                  <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                    dlBack ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, setDlBack, 'dl_back')}
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
              
              {/* DL Validation Status - RAD AI Report */}
              {dlFront && dlBack && dlValidation.status !== 'idle' && (
                <Card className={`overflow-hidden ${
                  dlValidation.status === 'validating' ? 'border-blue-500/30' :
                  dlValidation.status === 'valid' ? 'border-green-500/30' :
                  'border-amber-500/30'
                }`}>
                  <div className={`px-4 py-3 flex items-center gap-3 ${
                    dlValidation.status === 'validating' ? 'bg-blue-500/10' :
                    dlValidation.status === 'valid' ? 'bg-green-500/10' :
                    'bg-amber-500/10'
                  }`}>
                    {dlValidation.status === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    {dlValidation.status === 'valid' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {dlValidation.status === 'concerns' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        dlValidation.status === 'validating' ? 'text-blue-700' :
                        dlValidation.status === 'valid' ? 'text-green-700' :
                        'text-amber-700'
                      }`}>
                        {dlValidation.status === 'validating' ? 'RAD AI Analyzing Driver\'s License...' :
                         dlValidation.status === 'valid' ? 'Driver\'s License Verified' :
                         'Concerns Detected'}
                      </p>
                      <p className="text-xs text-muted-foreground">{dlValidation.message}</p>
                    </div>
                  </div>
                  
                  {/* Extracted Data Display */}
                  {dlValidation.extractedData && dlValidation.status !== 'validating' && (
                    <CardContent className="p-4 pt-3 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-[#CC0000]" />
                        <span className="text-xs font-semibold text-[#CC0000]">RAD AI Extracted Data</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {dlValidation.extractedData.name && (
                          <div>
                            <span className="text-muted-foreground text-xs">Name</span>
                            <p className="font-medium truncate">{dlValidation.extractedData.name}</p>
                          </div>
                        )}
                        {dlValidation.extractedData.issuingState && (
                          <div>
                            <span className="text-muted-foreground text-xs">Issuing State</span>
                            <p className="font-medium">{dlValidation.extractedData.issuingState}</p>
                          </div>
                        )}
                        {dlValidation.extractedData.licenseNumber && (
                          <div>
                            <span className="text-muted-foreground text-xs">License #</span>
                            <p className="font-medium font-mono text-xs">{dlValidation.extractedData.licenseNumber}</p>
                          </div>
                        )}
                        {dlValidation.extractedData.expirationDate && (
                          <div>
                            <span className="text-muted-foreground text-xs">Expires</span>
                            <p className={`font-medium ${dlValidation.analysis?.isExpired ? 'text-red-600' : ''}`}>
                              {dlValidation.extractedData.expirationDate}
                              {dlValidation.analysis?.isExpired && ' (EXPIRED)'}
                            </p>
                          </div>
                        )}
                        {dlValidation.extractedData.address && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground text-xs">Address</span>
                            <p className="font-medium text-xs">
                              {dlValidation.extractedData.address}
                              {dlValidation.extractedData.city && `, ${dlValidation.extractedData.city}`}
                              {dlValidation.extractedData.state && `, ${dlValidation.extractedData.state}`}
                              {dlValidation.extractedData.zipCode && ` ${dlValidation.extractedData.zipCode}`}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Concerns List */}
                      {dlValidation.concerns && dlValidation.concerns.length > 0 && (
                        <div className="mt-3 p-2 bg-amber-500/10 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Concerns:</p>
                          <ul className="text-xs text-amber-600 space-y-0.5">
                            {dlValidation.concerns.map((concern, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Insurance Upload */}
              <div className="space-y-2">
                <Label>Proof of Insurance <span className="text-red-500">*</span></Label>
                <div className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                  insurance ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-[#CC0000]/50'
                }`}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, setInsurance, 'insurance')}
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

              {/* Insurance Validation Status - RAD AI Report */}
              {insurance && insuranceValidation.status !== 'idle' && (
                <Card className={`overflow-hidden ${
                  insuranceValidation.status === 'validating' ? 'border-blue-500/30' :
                  insuranceValidation.status === 'valid' ? 'border-green-500/30' :
                  'border-amber-500/30'
                }`}>
                  <div className={`px-4 py-3 flex items-center gap-3 ${
                    insuranceValidation.status === 'validating' ? 'bg-blue-500/10' :
                    insuranceValidation.status === 'valid' ? 'bg-green-500/10' :
                    'bg-amber-500/10'
                  }`}>
                    {insuranceValidation.status === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    {insuranceValidation.status === 'valid' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    {insuranceValidation.status === 'concerns' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        insuranceValidation.status === 'validating' ? 'text-blue-700' :
                        insuranceValidation.status === 'valid' ? 'text-green-700' :
                        'text-amber-700'
                      }`}>
                        {insuranceValidation.status === 'validating' ? 'RAD AI Analyzing Insurance Document...' :
                         insuranceValidation.status === 'valid' ? 'Insurance Verified' :
                         'Concerns Detected'}
                      </p>
                      <p className="text-xs text-muted-foreground">{insuranceValidation.message}</p>
                    </div>
                  </div>
                  
                  {/* Extracted Insurance Data Display */}
                  {insuranceValidation.extractedData && insuranceValidation.status !== 'validating' && (
                    <CardContent className="p-4 pt-3 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-[#CC0000]" />
                        <span className="text-xs font-semibold text-[#CC0000]">RAD AI Extracted Data</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {insuranceValidation.extractedData.insurerName && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground text-xs">Insurance Company</span>
                            <p className="font-medium">{insuranceValidation.extractedData.insurerName}</p>
                          </div>
                        )}
                        {insuranceValidation.extractedData.policyNumber && (
                          <div>
                            <span className="text-muted-foreground text-xs">Policy #</span>
                            <p className="font-medium font-mono text-xs">{insuranceValidation.extractedData.policyNumber}</p>
                          </div>
                        )}
                        {insuranceValidation.extractedData.insuredName && (
                          <div>
                            <span className="text-muted-foreground text-xs">Insured</span>
                            <p className="font-medium truncate">{insuranceValidation.extractedData.insuredName}</p>
                          </div>
                        )}
                        {insuranceValidation.extractedData.effectiveDate && (
                          <div>
                            <span className="text-muted-foreground text-xs">Effective</span>
                            <p className="font-medium">{insuranceValidation.extractedData.effectiveDate}</p>
                          </div>
                        )}
                        {insuranceValidation.extractedData.expirationDate && (
                          <div>
                            <span className="text-muted-foreground text-xs">Expires</span>
                            <p className={`font-medium ${insuranceValidation.analysis?.isExpired ? 'text-red-600' : ''}`}>
                              {insuranceValidation.extractedData.expirationDate}
                              {insuranceValidation.analysis?.isExpired && ' (EXPIRED)'}
                            </p>
                          </div>
                        )}
                        
                        {/* Vehicle Info from Insurance */}
                        {(insuranceValidation.extractedData.vehicleMake || insuranceValidation.extractedData.vehicleYear) && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-border">
                            <span className="text-muted-foreground text-xs">Covered Vehicle</span>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-medium text-sm">
                                {[
                                  insuranceValidation.extractedData.vehicleYear,
                                  insuranceValidation.extractedData.vehicleMake,
                                  insuranceValidation.extractedData.vehicleModel
                                ].filter(Boolean).join(' ') || 'Not specified'}
                              </p>
                              {insuranceValidation.analysis?.vehicleMatch === 'match' && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-700 text-xs rounded-full font-medium">
                                  Matches Listed Vehicle
                                </span>
                              )}
                              {insuranceValidation.analysis?.vehicleMatch === 'mismatch' && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-700 text-xs rounded-full font-medium">
                                  Vehicle Mismatch
                                </span>
                              )}
                            </div>
                            {insuranceValidation.analysis?.vehicleMatchDetails && insuranceValidation.analysis.vehicleMatch !== 'match' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {insuranceValidation.analysis.vehicleMatchDetails}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Coverage Types */}
                        {insuranceValidation.extractedData.coverageTypes && insuranceValidation.extractedData.coverageTypes.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground text-xs">Coverage</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {insuranceValidation.extractedData.coverageTypes.map((coverage, i) => (
                                <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                                  {coverage}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Concerns List */}
                      {insuranceValidation.concerns && insuranceValidation.concerns.length > 0 && (
                        <div className="mt-3 p-2 bg-amber-500/10 rounded-lg">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Concerns:</p>
                          <ul className="text-xs text-amber-600 space-y-0.5">
                            {insuranceValidation.concerns.map((concern, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  )}
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

            {/* Missing Fields Warning */}
            {(!vinDecoded || !year || !make || !model || !category || !mileage || !dailyRate || !dlFront || !dlBack || !insurance) && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm font-medium text-amber-700 mb-2">Please complete the following to continue:</p>
                <ul className="text-sm text-amber-600 space-y-1">
                  {!vinDecoded && <li>• Decode your VIN or enter vehicle details manually</li>}
                  {!year && <li>• Select vehicle year</li>}
                  {!make && <li>• Select vehicle make</li>}
                  {!model && <li>• Select vehicle model</li>}
                  {!category && <li>• Select vehicle category</li>}
                  {!mileage && <li>• Enter current mileage</li>}
                  {!dailyRate && <li>• Set daily rental rate</li>}
                  {!dlFront && <li>• Upload driver&apos;s license (front)</li>}
                  {!dlBack && <li>• Upload driver&apos;s license (back)</li>}
                  {!insurance && <li>• Upload proof of insurance</li>}
                </ul>
              </div>
            )}

            {/* Debug: Show which validation is failing */}
            {(!year || !make || !model || !category || !mileage || !dailyRate || !dlFront || !dlBack || !insurance) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">Missing required fields:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {!year && <li>Year</li>}
                  {!make && <li>Make</li>}
                  {!model && <li>Model</li>}
                  {!category && <li>Category</li>}
                  {!mileage && <li>Mileage</li>}
                  {!dailyRate && <li>Daily Rate</li>}
                  {!dlFront && <li>Driver License (Front)</li>}
                  {!dlBack && <li>Driver License (Back)</li>}
                  {!insurance && <li>Insurance Document</li>}
                </ul>
              </div>
            )}
            
            {/* Submit Button - VIN optional for testing */}
            <Button
              type="submit"
              disabled={isLoading || uploadingDocs || !year || !make || !model || !category || !mileage || !dailyRate || !dlFront || !dlBack || !insurance || recallStatus === 'critical'}
              className="w-full h-12 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium text-lg disabled:opacity-50"
            >
              {isLoading || uploadingDocs ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {uploadingDocs ? 'Uploading Documents...' : 'Submitting...'}
                </>
              ) : (
                'Continue to Safety Standards'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              After listing, you&apos;ll review our safety standards and set up payouts.
            </p>
          </form>
        </div>
        )}
      </div>
    </div>
  )
}
