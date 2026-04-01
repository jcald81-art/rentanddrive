'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, CreditCard, ShieldCheck, Car, Check, ChevronRight, ChevronLeft,
  Upload, Loader2, AlertCircle, Camera, Building2, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/ui/image-upload'

const STEPS = [
  { id: 1, title: 'Profile & License', icon: User, description: 'Your info and driver license' },
  { id: 2, title: 'Business & Banking', icon: CreditCard, description: 'How you get paid' },
  { id: 3, title: 'Background Check', icon: ShieldCheck, description: 'Quick safety verification' },
  { id: 4, title: 'First Vehicle', icon: Car, description: 'List your first car' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

interface OnboardingData {
  avatar_url?: string
  full_name?: string
  phone?: string
  license_front_url?: string
  license_back_url?: string
  license_number?: string
  license_state?: string
  license_expiry?: string
  business_name?: string
  business_type?: 'individual' | 'llc' | 'corporation'
  stripe_onboarding_complete?: boolean
  checkr_status?: 'pending' | 'clear' | 'consider' | 'suspended'
  first_vehicle_id?: string
  current_step: number
  completed: boolean
}

export default function HostOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    current_step: 1,
    completed: false,
  })

  // Fetch existing onboarding progress
  useEffect(() => {
    async function fetchOnboarding() {
      try {
        const res = await fetch('/api/onboarding/host')
        if (res.ok) {
          const { onboarding } = await res.json()
          if (onboarding) {
            setData(onboarding)
            setStep(onboarding.current_step || 1)
          }
        }
      } catch (err) {
        console.error('Failed to fetch onboarding:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOnboarding()
  }, [])

  const updateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const saveProgress = async (newStep?: number) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding/host', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          current_step: newStep || step,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Failed to save')
      }
      if (newStep) setStep(newStep)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (file: File, bucket: string, folder: string, filename?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('folder', folder)
    if (filename) formData.append('filename', filename)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    return res.json()
  }

  const nextStep = async () => {
    if (step < 4) {
      await saveProgress(step + 1)
    } else {
      // Complete onboarding
      await fetch('/api/onboarding/host', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true, current_step: 4 }),
      })
      router.push('/hostslab/lobby')
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const triggerBackgroundCheck = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/checkr/create-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: data.full_name,
          email: '', // Will be filled from auth
          phone: data.phone,
          license_number: data.license_number,
          license_state: data.license_state,
        }),
      })
      if (res.ok) {
        updateField('checkr_status', 'pending')
        await saveProgress()
      }
    } catch (err: any) {
      setError('Failed to initiate background check')
    } finally {
      setSaving(false)
    }
  }

  const startStripeOnboarding = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: data.business_name,
          business_type: data.business_type,
        }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) {
          window.location.href = url
        }
      }
    } catch (err) {
      setError('Failed to start Stripe onboarding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Host</h1>
          <p className="text-muted-foreground">
            Complete these steps to start earning with your vehicles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      step > s.id
                        ? 'bg-[#CC0000] text-white'
                        : step === s.id
                          ? 'bg-[#0D0D0D] text-white'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-1 text-center hidden sm:block ${
                    step === s.id ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {s.title}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step > s.id ? 'bg-[#CC0000]' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[step - 1].icon
                return <StepIcon className="h-5 w-5 text-[#CC0000]" />
              })()}
              {STEPS[step - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Profile & License */}
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Avatar */}
                  <div className="sm:col-span-2 flex justify-center">
                    <div className="w-32">
                      <ImageUpload
                        value={data.avatar_url}
                        onChange={(url) => updateField('avatar_url', url)}
                        onUpload={(file) => handleUpload(file, 'avatars', 'temp', 'avatar')}
                        placeholder="Profile Photo"
                        aspectRatio="square"
                        className="rounded-full overflow-hidden"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name (as on license)</Label>
                    <Input
                      id="full_name"
                      value={data.full_name || ''}
                      onChange={(e) => updateField('full_name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={data.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                </div>

                <Separator />

                {/* Driver License Upload */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#CC0000]" />
                    Driver License
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ImageUpload
                      value={data.license_front_url}
                      onChange={(url) => updateField('license_front_url', url)}
                      onUpload={(file) => handleUpload(file, 'licenses', 'temp', 'license-front')}
                      label="Front of License"
                      placeholder="Upload front"
                      aspectRatio="video"
                    />
                    <ImageUpload
                      value={data.license_back_url}
                      onChange={(url) => updateField('license_back_url', url)}
                      onUpload={(file) => handleUpload(file, 'licenses', 'temp', 'license-back')}
                      label="Back of License"
                      placeholder="Upload back"
                      aspectRatio="video"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={data.license_number || ''}
                      onChange={(e) => updateField('license_number', e.target.value)}
                      placeholder="DL12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_state">State</Label>
                    <Select
                      value={data.license_state || ''}
                      onValueChange={(v) => updateField('license_state', v)}
                    >
                      <SelectTrigger id="license_state">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_expiry">Expiration Date</Label>
                    <Input
                      id="license_expiry"
                      type="date"
                      value={data.license_expiry || ''}
                      onChange={(e) => updateField('license_expiry', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Business & Banking */}
            {step === 2 && (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name (optional)</Label>
                    <Input
                      id="business_name"
                      value={data.business_name || ''}
                      onChange={(e) => updateField('business_name', e.target.value)}
                      placeholder="Your Name or LLC Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business Type</Label>
                    <Select
                      value={data.business_type || 'individual'}
                      onValueChange={(v) => updateField('business_type', v)}
                    >
                      <SelectTrigger id="business_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual / Sole Proprietor</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Stripe Connect */}
                <div className="p-6 border rounded-lg bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-[#635BFF]/10">
                      <CreditCard className="h-6 w-6 text-[#635BFF]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Set Up Payouts with Stripe</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your bank account to receive earnings. Stripe handles all payments securely.
                      </p>
                      {data.stripe_onboarding_complete ? (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          onClick={startStripeOnboarding}
                          disabled={saving}
                          className="bg-[#635BFF] hover:bg-[#635BFF]/90"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Connect with Stripe
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  You can skip this step and set up payouts later, but you won&apos;t receive earnings until connected.
                </p>
              </>
            )}

            {/* Step 3: Background Check */}
            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-[#CC0000]/10 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-10 w-10 text-[#CC0000]" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">Background Verification</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We partner with Checkr to run a quick background check. This helps keep everyone safe and typically takes 1-3 business days.
                </p>

                {data.checkr_status === 'pending' ? (
                  <div className="space-y-4">
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Background check in progress
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll email you when it&apos;s complete. You can continue to the next step.
                    </p>
                  </div>
                ) : data.checkr_status === 'clear' ? (
                  <Badge className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Button
                    onClick={triggerBackgroundCheck}
                    disabled={saving || !data.full_name || !data.license_number}
                    className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Start Background Check
                  </Button>
                )}

                {!data.full_name || !data.license_number ? (
                  <p className="text-sm text-destructive mt-4">
                    Please complete Step 1 (Profile & License) first.
                  </p>
                ) : null}
              </div>
            )}

            {/* Step 4: First Vehicle */}
            {step === 4 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-full bg-[#CC0000]/10 flex items-center justify-center mx-auto mb-6">
                  <Car className="h-10 w-10 text-[#CC0000]" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2">Add Your First Vehicle</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  List your first car to start earning. Our photo session guide will help you capture great images.
                </p>

                {data.first_vehicle_id ? (
                  <div className="space-y-4">
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Vehicle Added
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Great! You&apos;re ready to start hosting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      asChild
                      className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                    >
                      <Link href="/host/vehicles/add">
                        <Car className="h-4 w-4 mr-2" />
                        Add Vehicle
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Or skip this step and add vehicles later from your dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || saving}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={saving}
            className="bg-[#CC0000] hover:bg-[#CC0000]/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {step === 4 ? 'Complete Setup' : 'Continue'}
            {step < 4 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center mt-4">
          <Link href="/hostslab/lobby" className="text-sm text-muted-foreground hover:underline">
            Skip for now and complete later
          </Link>
        </div>
      </div>
    </div>
  )
}
