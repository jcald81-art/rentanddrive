'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { VerificationBadge } from '@/components/verification-badge'
import { 
  User, 
  ShieldCheck, 
  Wallet, 
  Car, 
  Camera, 
  Check, 
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Shield
} from 'lucide-react'
import { MFAPromptBanner, MFAEnrollment } from '@/components/mfa-enrollment'
import { SafetyStandards } from '@/components/safety-standards'

const STEPS = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Identity', icon: ShieldCheck },
  { id: 3, label: 'Payouts', icon: Wallet },
  { id: 4, label: 'Vehicle', icon: Car },
  { id: 5, label: 'Photos', icon: Camera },
]

const VEHICLE_MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Tesla', 'BMW', 'Mercedes-Benz', 'Audi', 'Subaru', 'Jeep', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Lexus', 'Volkswagen', 'GMC', 'RAM', 'Dodge', 'Porsche']
const VEHICLE_CATEGORIES = ['Sedan', 'SUV', 'Truck', 'Luxury', 'Sports', 'Van', 'Electric']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const VEHICLE_FEATURES = [
  'Bluetooth', 'Apple CarPlay', 'Android Auto', 'Backup Camera', 
  'GPS Navigation', 'Sunroof', 'Child Seat Available', 'Pet Friendly', 
  'Ski Rack', 'Toll Pass'
]

export default function HostOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Step 1 - Account
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({})

  // Step 2 - Identity
  const [identityVerified, setIdentityVerified] = useState(false)
  const [identitySkipped, setIdentitySkipped] = useState(false)
  
  // MFA Prompt
  const [showMfaPrompt, setShowMfaPrompt] = useState(true)
  const [showMfaSetup, setShowMfaSetup] = useState(false)

  // Step 3 - Payouts
  const [payoutsConnected, setPayoutsConnected] = useState(false)
  const [payoutsSkipped, setPayoutsSkipped] = useState(false)

  // Step 4 - Vehicle
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [licenseState, setLicenseState] = useState('')
  const [vin, setVin] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [weeklyRate, setWeeklyRate] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [transmission, setTransmission] = useState<'auto' | 'manual'>('auto')
  const [seats, setSeats] = useState('5')
  const [features, setFeatures] = useState<string[]>([])
  const [vehicleErrors, setVehicleErrors] = useState<Record<string, string>>({})

  // Safety Standards (between step 4 and 5)
  const [showSafetyStep, setShowSafetyStep] = useState(false)
  const [safetyAgreed, setSafetyAgreed] = useState(false)
  
  // Step 5 - Photos
  const [photos, setPhotos] = useState<File[]>([])
  const [photoShootBooked, setPhotoShootBooked] = useState(false)

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '33%' }
    if (pwd.length < 10 || !/[!@#$%^&*]/.test(pwd)) return { label: 'Fair', color: 'bg-yellow-500', width: '66%' }
    return { label: 'Strong', color: 'bg-green-500', width: '100%' }
  }

  const passwordStrength = getPasswordStrength(password)

  // Validation
  const validateStep1 = () => {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'First name is required'
    if (!lastName.trim()) errors.lastName = 'Last name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setAccountErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep4 = () => {
    const errors: Record<string, string> = {}
    if (!vehicleYear) errors.vehicleYear = 'Year is required'
    if (!vehicleMake.trim()) errors.vehicleMake = 'Make is required'
    if (!vehicleModel.trim()) errors.vehicleModel = 'Model is required'
    if (!vehicleColor.trim()) errors.vehicleColor = 'Color is required'
    if (!licensePlate.trim()) errors.licensePlate = 'License plate is required'
    if (!licenseState) errors.licenseState = 'State is required'
    if (!dailyRate) errors.dailyRate = 'Daily rate is required'
    if (!category) errors.category = 'Category is required'
    setVehicleErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handlers
  const handleCreateAccount = async () => {
    if (!validateStep1()) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/host/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const data = await response.json()
      if (data.success) {
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyIdentity = () => {
    window.location.href = '/renter/verify?redirect=/host/onboarding?step=2'
  }

  const handleConnectPayouts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/connect-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to connect payouts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateListing = async () => {
    if (!validateStep4()) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/host/listing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: parseInt(vehicleYear),
          make: vehicleMake,
          model: vehicleModel,
          color: vehicleColor,
          licensePlate,
          licenseState,
          vin,
          dailyRate: parseFloat(dailyRate),
          weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
          description,
          category,
          transmission,
          seats: parseInt(seats),
          features,
        }),
      })
      const data = await response.json()
      if (data.listingId) {
        setListingId(data.listingId)
        // Show safety standards before moving to photos
        setShowSafetyStep(true)
      }
    } catch (error) {
      console.error('Failed to create listing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)])
    }
  }

  const handlePublishListing = async () => {
    setIsLoading(true)
    // Simulate publish
    await new Promise(resolve => setTimeout(resolve, 1000))
    setCurrentStep(6) // Success state
    setIsLoading(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://rentanddrive.net/vehicles/${listingId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canPublish = photos.length >= 3 || photoShootBooked

  const toggleFeature = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  // Generate year options
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i + 1)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Progress Bar */}
      {currentStep <= 5 && (
        <div className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        currentStep > step.id 
                          ? 'bg-[#FFD84D] text-[#0a0a0a]' 
                          : currentStep === step.id 
                            ? 'bg-[#FFD84D] text-[#0a0a0a]' 
                            : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`mt-1 text-xs font-medium ${
                      currentStep >= step.id ? 'text-white' : 'text-white/50'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 md:w-24 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-[#FFD84D]' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Step 1 - Account */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-sans">Create Your Host Account</h1>
              <p className="mt-2 text-white/60">Start earning with your vehicle</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/80">First Name</Label>
                  <Input 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="John"
                  />
                  {accountErrors.firstName && (
                    <p className="mt-1 text-xs text-red-400">{accountErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/80">Last Name</Label>
                  <Input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    placeholder="Smith"
                  />
                  {accountErrors.lastName && (
                    <p className="mt-1 text-xs text-red-400">{accountErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white/80">Email</Label>
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="you@example.com"
                />
                {accountErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{accountErrors.email}</p>
                )}
              </div>

              <div>
                <Label className="text-white/80">Password</Label>
                <div className="relative mt-1">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10"
                    placeholder="Min. 6 characters"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-white/50">Password strength: {passwordStrength.label}</p>
                  </div>
                )}
                {accountErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{accountErrors.password}</p>
                )}
              </div>

              <div>
                <Label className="text-white/80">Confirm Password</Label>
                <Input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  placeholder="Re-enter your password"
                />
                {accountErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">{accountErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <Button 
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="w-full bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold h-12"
            >
              {isLoading ? 'Creating Account...' : 'Create Host Account'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-center text-white/50 text-sm">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#FFD84D] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2 - Identity */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-sans">Verify Your Identity</h1>
              <p className="mt-2 text-white/60">Required to accept payments and build trust</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center space-y-6">
              <div className="flex justify-center">
                <VerificationBadge verified={identityVerified} />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">Identity Verification</h2>
                <p className="mt-2 text-white/60 text-sm">
                  We use Stripe Identity to verify your driver&apos;s license. 
                  This protects both you and your renters.
                </p>
              </div>

              <Button 
                onClick={handleVerifyIdentity}
                className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify with Stripe Identity
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>

              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={() => { setIdentitySkipped(true); setCurrentStep(3) }}
                  className="text-white/50 hover:text-white/70 text-sm"
                >
                  Skip for now — complete before first rental
                </button>
              </div>

              <div className="flex items-start gap-2 text-xs text-white/40 bg-white/5 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Required before your listing goes live and you can accept bookings.</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(1)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Payouts */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-sans">Set Up Payouts</h1>
              <p className="mt-2 text-white/60">Connect your bank account to receive earnings</p>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-white/60" />
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold">Connect Bank Account</h2>
                <p className="mt-2 text-white/60 text-sm">
                  We partner with Stripe for secure, fast payouts. 
                  You&apos;ll receive <span className="text-[#FFD84D] font-semibold">85% of each rental</span>.
                </p>
              </div>

              <Button 
                onClick={handleConnectPayouts}
                disabled={isLoading}
                className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isLoading ? 'Connecting...' : 'Connect Bank Account via Stripe'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>

              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={() => { setPayoutsSkipped(true); setCurrentStep(4) }}
                  className="text-white/50 hover:text-white/70 text-sm"
                >
                  Skip for now
                </button>
              </div>

              <div className="text-xs text-white/40 bg-white/5 rounded-lg p-3">
                Payouts are sent every 7 days to your connected bank account.
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(2)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 - Vehicle */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-sans">List Your Vehicle</h1>
              <p className="mt-2 text-white/60">Tell us about your car</p>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white/80">Year</Label>
                  <select 
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                  >
                    <option value="">Select</option>
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {vehicleErrors.vehicleYear && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.vehicleYear}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/80">Make</Label>
                  <Input 
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    list="makes"
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    placeholder="Toyota"
                  />
                  <datalist id="makes">
                    {VEHICLE_MAKES.map(make => (
                      <option key={make} value={make} />
                    ))}
                  </datalist>
                  {vehicleErrors.vehicleMake && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.vehicleMake}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/80">Model</Label>
                  <Input 
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    placeholder="Camry"
                  />
                  {vehicleErrors.vehicleModel && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.vehicleModel}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-white/80">Color</Label>
                  <Input 
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    placeholder="Silver"
                  />
                  {vehicleErrors.vehicleColor && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.vehicleColor}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/80">License Plate</Label>
                  <Input 
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                    placeholder="ABC1234"
                  />
                  {vehicleErrors.licensePlate && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.licensePlate}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white/80">State</Label>
                  <select 
                    value={licenseState}
                    onChange={(e) => setLicenseState(e.target.value)}
                    className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {vehicleErrors.licenseState && (
                    <p className="mt-1 text-xs text-red-400">{vehicleErrors.licenseState}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-white/80">VIN (Optional)</Label>
                <Input 
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  className="mt-1 bg-white/5 border-white/10 text-white font-mono"
                  placeholder="17 characters"
                  maxLength={17}
                />
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Daily Rate</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-lg font-mono">$</span>
                      <Input 
                        type="number"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        className="pl-8 bg-white/5 border-white/10 text-white text-xl font-mono h-14"
                        placeholder="75"
                      />
                    </div>
                    {vehicleErrors.dailyRate && (
                      <p className="mt-1 text-xs text-red-400">{vehicleErrors.dailyRate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white/80">Weekly Rate (Optional)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-lg font-mono">$</span>
                      <Input 
                        type="number"
                        value={weeklyRate}
                        onChange={(e) => setWeeklyRate(e.target.value)}
                        className="pl-8 bg-white/5 border-white/10 text-white text-xl font-mono h-14"
                        placeholder="450"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white/80">Category</Label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                    >
                      <option value="">Select</option>
                      {VEHICLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {vehicleErrors.category && (
                      <p className="mt-1 text-xs text-red-400">{vehicleErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white/80">Transmission</Label>
                    <div className="mt-1 flex rounded-md overflow-hidden border border-white/10">
                      <button 
                        onClick={() => setTransmission('auto')}
                        className={`flex-1 py-2 text-sm ${transmission === 'auto' ? 'bg-[#FFD84D] text-[#0a0a0a]' : 'bg-white/5 text-white'}`}
                      >
                        Auto
                      </button>
                      <button 
                        onClick={() => setTransmission('manual')}
                        className={`flex-1 py-2 text-sm ${transmission === 'manual' ? 'bg-[#FFD84D] text-[#0a0a0a]' : 'bg-white/5 text-white'}`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/80">Seats</Label>
                    <div className="mt-1 flex rounded-md overflow-hidden border border-white/10">
                      {['2', '4', '5', '7', '8'].map(s => (
                        <button 
                          key={s}
                          onClick={() => setSeats(s)}
                          className={`flex-1 py-2 text-sm ${seats === s ? 'bg-[#FFD84D] text-[#0a0a0a]' : 'bg-white/5 text-white'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-white/80">Description</Label>
                <Textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="mt-1 bg-white/5 border-white/10 text-white min-h-[100px]"
                  placeholder="Tell renters about your vehicle..."
                />
                <p className="mt-1 text-xs text-white/40 text-right">{description.length}/500</p>
              </div>

              {/* Features */}
              <div>
                <Label className="text-white/80 mb-3 block">Features</Label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_FEATURES.map(feature => (
                    <label 
                      key={feature}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10"
                    >
                      <Checkbox 
                        checked={features.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(3)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateListing}
                disabled={isLoading}
                className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold"
              >
                {isLoading ? 'Saving...' : 'Review Safety Standards'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Safety Standards (between Step 4 and 5) */}
        {currentStep === 4 && showSafetyStep && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="my-8">
              <SafetyStandards 
                onAgree={() => {
                  setSafetyAgreed(true)
                  setShowSafetyStep(false)
                  setCurrentStep(5)
                }}
                onBack={() => setShowSafetyStep(false)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Step 5 - Photos */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold font-sans">Add Photos</h1>
              <p className="mt-2 text-white/60">Great photos help your listing stand out</p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <label className="block">
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-[#FFD84D]/50 transition-colors cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-white/40" />
                  <p className="mt-4 text-white/60">Drag and drop photos here, or click to select</p>
                  <p className="mt-1 text-sm text-white/40">PNG, JPG up to 10MB each</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                />
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                      <span className="text-white/40 text-sm">{photo.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className={`text-sm ${photos.length >= 3 ? 'text-green-400' : 'text-white/50'}`}>
                {photos.length} of 3 minimum photos
              </p>
            </div>

            {/* Pro Photo Shoot */}
            <div className="border border-[#FFD84D]/30 bg-[#FFD84D]/5 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFD84D]/10 flex items-center justify-center shrink-0">
                  <Camera className="h-6 w-6 text-[#FFD84D]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#FFD84D]">Book a Professional Photo Shoot</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Professional photos get <span className="text-[#FFD84D]">40% more bookings</span>. 
                    A photographer comes to you.
                  </p>
                  <Button 
                    asChild
                    variant="outline"
                    className="mt-4 border-[#FFD84D]/50 text-[#FFD84D] hover:bg-[#FFD84D]/10"
                  >
                    <Link href="/host/photo-shoot">
                      Book via Snappr
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentStep(4)}
                className="text-white/60 hover:text-white"
              >
                Back
              </Button>
              <Button 
                onClick={handlePublishListing}
                disabled={!canPublish || isLoading}
                className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Publishing...' : 'Publish My Listing'}
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {currentStep === 6 && (
          <div className="space-y-8 text-center py-12">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Your listing is live!</h1>
              <p className="mt-2 text-white/60">
                Congratulations! Your {vehicleYear} {vehicleMake} {vehicleModel} is now available for booking.
              </p>
            </div>

            {/* Share Link */}
            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3 max-w-md mx-auto">
              <span className="text-sm text-white/60 truncate flex-1 font-mono">
                rentanddrive.net/vehicles/{listingId}
              </span>
              <Button 
                onClick={handleCopyLink}
                variant="ghost"
                size="sm"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button 
              asChild
              className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-[#0a0a0a] font-semibold"
            >
              <Link href="/host/dashboard">
                Go to My Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {/* MFA Security Prompt */}
            {showMfaPrompt && !showMfaSetup && (
              <div className="max-w-md mx-auto text-left">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        Enable MFA for extra security
                      </h3>
                      <p className="text-sm text-white/60 mt-1">
                        Protect your vehicles and earnings with two-factor authentication. Takes just 30 seconds.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button 
                          onClick={() => setShowMfaSetup(true)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Enable Now
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowMfaPrompt(false)}
                          className="text-white/60 hover:text-white"
                        >
                          Maybe later
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MFA Setup Modal */}
            {showMfaSetup && (
              <div className="max-w-md mx-auto text-left">
                <MFAEnrollment 
                  showAsCard={true} 
                  onClose={() => {
                    setShowMfaSetup(false)
                    setShowMfaPrompt(false)
                  }} 
                />
              </div>
            )}

            {/* Reminder Card */}
            {(identitySkipped || payoutsSkipped) && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#FFD84D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Complete your setup</p>
                    <p className="mt-1 text-xs text-white/60">
                      Don&apos;t forget to verify your identity and set up payouts to start accepting bookings.
                    </p>
                    <div className="mt-3 flex gap-2">
                      {identitySkipped && (
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link href="/renter/verify">Verify Identity</Link>
                        </Button>
                      )}
                      {payoutsSkipped && (
                        <Button asChild size="sm" variant="outline" className="text-xs">
                          <Link href="/host/dashboard#payouts">Set Up Payouts</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
