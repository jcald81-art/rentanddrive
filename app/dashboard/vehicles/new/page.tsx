'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { VinCheckWidget } from '@/components/vin/vin-check-widget'
import { 
  Car, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload,
  X,
  Loader2,
  DollarSign,
  MapPin,
  Camera,
  Settings,
  FileText,
} from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Car },
  { id: 2, title: 'Features', icon: Settings },
  { id: 3, title: 'Photos', icon: Camera },
  { id: 4, title: 'Pricing', icon: DollarSign },
  { id: 5, title: 'Location', icon: MapPin },
  { id: 6, title: 'VIN Check', icon: FileText },
]

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

export default function NewVehiclePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'car',
    color: '',
    vin: '',
    license_plate: '',
    mileage: '',
    description: '',

    // Step 2: Features
    is_awd: false,
    has_ski_rack: false,
    has_tow_hitch: false,
    seats: 5,
    fuel_type: 'gasoline',
    transmission: 'automatic',

    // Step 3: Photos
    photos: [] as string[],

    // Step 4: Pricing
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    security_deposit: '',
    min_days: 1,
    max_days: 30,
    advance_notice_hours: 24,

    // Step 5: Location
    location_city: 'Reno',
    location_state: 'NV',
    pickup_instructions: '',

    // Step 6: VIN Check
    vin_report_purchased: false,
  })

  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])

  function updateFormData(field: string, value: unknown) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls])
    setPhotoFiles(prev => [...prev, ...files])
  }

  function removePhoto(index: number) {
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function uploadPhotosToSupabase(): Promise<string[]> {
    if (photoFiles.length === 0) return []

    setUploadingPhotos(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const uploadedUrls: string[] = []

    for (const file of photoFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('vehicle-photos')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(data.path)

      uploadedUrls.push(publicUrl)
    }

    setUploadingPhotos(false)
    return uploadedUrls
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to add a vehicle')
      }

      // Upload photos first
      const photoUrls = await uploadPhotosToSupabase()

      // Create vehicle
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          host_id: user.id,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          category: formData.category,
          color: formData.color,
          vin: formData.vin || null,
          license_plate: formData.license_plate || null,
          mileage: formData.mileage ? parseInt(formData.mileage) : null,
          description: formData.description || null,
          is_awd: formData.is_awd,
          has_ski_rack: formData.has_ski_rack,
          has_tow_hitch: formData.has_tow_hitch,
          seats: formData.seats,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          thumbnail: photoUrls[0] || null,
          photos: photoUrls,
          daily_rate: parseFloat(formData.daily_rate) || 0,
          weekly_rate: formData.weekly_rate ? parseFloat(formData.weekly_rate) : null,
          monthly_rate: formData.monthly_rate ? parseFloat(formData.monthly_rate) : null,
          security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
          min_rental_days: formData.min_days,
          max_rental_days: formData.max_days,
          advance_notice_hours: formData.advance_notice_hours,
          location_city: formData.location_city,
          location_state: formData.location_state,
          pickup_instructions: formData.pickup_instructions || null,
          is_active: false,
          is_approved: false, // Requires admin approval
          instant_book: true,
        })

      if (insertError) throw insertError

      // Redirect to vehicles list
      router.push('/dashboard/vehicles?success=created')
    } catch (err) {
      console.error('Error creating vehicle:', err)
      setError(err instanceof Error ? err.message : 'Failed to create vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 1:
        return !!(formData.make && formData.model && formData.year && formData.category)
      case 2:
        return true // Features are optional
      case 3:
        return photoPreviewUrls.length >= 4
      case 4:
        return !!(formData.daily_rate && parseFloat(formData.daily_rate) > 0)
      case 5:
        return !!(formData.location_city && formData.location_state)
      case 6:
        return true // VIN check is optional upsell
      default:
        return false
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
          <p className="text-muted-foreground mt-1">
            List your vehicle and start earning
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center ${
                    isActive ? 'text-[#CC0000]' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-1
                    ${isActive ? 'bg-[#CC0000] text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-muted'}
                  `}>
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Enter your vehicle details'}
              {currentStep === 2 && 'Select features and capabilities'}
              {currentStep === 3 && 'Upload at least 4 photos'}
              {currentStep === 4 && 'Set your pricing and availability'}
              {currentStep === 5 && 'Where will renters pick up the vehicle?'}
              {currentStep === 6 && 'Optional: Get a VIN history report'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="make">Make *</Label>
                    <Input
                      id="make"
                      placeholder="Toyota"
                      value={formData.make}
                      onChange={(e) => updateFormData('make', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      placeholder="4Runner"
                      value={formData.model}
                      onChange={(e) => updateFormData('model', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => updateFormData('year', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => updateFormData('category', v)}
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
                      placeholder="Silver"
                      value={formData.color}
                      onChange={(e) => updateFormData('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      placeholder="17 characters"
                      maxLength={17}
                      value={formData.vin}
                      onChange={(e) => updateFormData('vin', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_plate">License Plate</Label>
                    <Input
                      id="license_plate"
                      placeholder="ABC123"
                      value={formData.license_plate}
                      onChange={(e) => updateFormData('license_plate', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mileage">Current Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="45000"
                    value={formData.mileage}
                    onChange={(e) => updateFormData('mileage', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell renters about your vehicle..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 2: Features */}
            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium">Capabilities</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="is_awd"
                        checked={formData.is_awd}
                        onCheckedChange={(checked) => updateFormData('is_awd', checked)}
                      />
                      <Label htmlFor="is_awd" className="cursor-pointer">
                        AWD / 4WD - All-wheel or four-wheel drive
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="has_ski_rack"
                        checked={formData.has_ski_rack}
                        onCheckedChange={(checked) => updateFormData('has_ski_rack', checked)}
                      />
                      <Label htmlFor="has_ski_rack" className="cursor-pointer">
                        Ski / Snowboard Rack - Roof-mounted cargo
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="has_tow_hitch"
                        checked={formData.has_tow_hitch}
                        onCheckedChange={(checked) => updateFormData('has_tow_hitch', checked)}
                      />
                      <Label htmlFor="has_tow_hitch" className="cursor-pointer">
                        Tow Hitch - Trailer towing capable
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="seats">Seats</Label>
                    <Select 
                      value={formData.seats.toString()} 
                      onValueChange={(v) => updateFormData('seats', parseInt(v))}
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
                      value={formData.fuel_type} 
                      onValueChange={(v) => updateFormData('fuel_type', v)}
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
                      value={formData.transmission} 
                      onValueChange={(v) => updateFormData('transmission', v)}
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
              </>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop photos or click to upload
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      Select Photos
                    </label>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum 4 photos required. First photo will be the thumbnail.
                  </p>
                </div>

                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs bg-[#CC0000] text-white px-2 py-1 rounded">
                            Thumbnail
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {photoPreviewUrls.length < 4 && (
                  <p className="text-sm text-amber-600">
                    Please upload at least {4 - photoPreviewUrls.length} more photo{4 - photoPreviewUrls.length > 1 ? 's' : ''}
                  </p>
                )}
              </>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="daily_rate">Daily Rate *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="daily_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="75"
                        className="pl-10"
                        value={formData.daily_rate}
                        onChange={(e) => updateFormData('daily_rate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weekly_rate">Weekly Rate (optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="weekly_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="450"
                        className="pl-10"
                        value={formData.weekly_rate}
                        onChange={(e) => updateFormData('weekly_rate', e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to use daily rate x 7
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="monthly_rate">Monthly Rate (optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="monthly_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1500"
                        className="pl-10"
                        value={formData.monthly_rate}
                        onChange={(e) => updateFormData('monthly_rate', e.target.value)}
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
                        placeholder="500"
                        className="pl-10"
                        value={formData.security_deposit}
                        onChange={(e) => updateFormData('security_deposit', e.target.value)}
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
                      max="30"
                      value={formData.min_days}
                      onChange={(e) => updateFormData('min_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_days">Maximum Days</Label>
                    <Input
                      id="max_days"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.max_days}
                      onChange={(e) => updateFormData('max_days', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="advance_notice">Advance Notice (hours)</Label>
                    <Input
                      id="advance_notice"
                      type="number"
                      min="1"
                      max="168"
                      value={formData.advance_notice_hours}
                      onChange={(e) => updateFormData('advance_notice_hours', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Location */}
            {currentStep === 5 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="location_city">City *</Label>
                    <Input
                      id="location_city"
                      placeholder="Reno"
                      value={formData.location_city}
                      onChange={(e) => updateFormData('location_city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_state">State *</Label>
                    <Select 
                      value={formData.location_state} 
                      onValueChange={(v) => updateFormData('location_state', v)}
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
                    placeholder="Where should renters meet you? Any parking instructions?"
                    rows={4}
                    value={formData.pickup_instructions}
                    onChange={(e) => updateFormData('pickup_instructions', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Step 6: VIN Check */}
            {currentStep === 6 && (
              <>
                {formData.vin ? (
                  <VinCheckWidget 
                    vin={formData.vin}
                    onReportPurchased={() => updateFormData('vin_report_purchased', true)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No VIN Provided</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Go back to Step 1 to add your VIN and get a verified history report.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vehicles with verified VIN reports get 30% more bookings.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              onClick={() => setCurrentStep(s => s + 1)}
              disabled={!canProceed()}
              className="bg-[#CC0000] hover:bg-[#CC0000]/90"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingPhotos}
              className="bg-[#CC0000] hover:bg-[#CC0000]/90"
            >
              {isSubmitting || uploadingPhotos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingPhotos ? 'Uploading photos...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
