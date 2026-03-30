'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Camera,
  FileCheck,
  Clock
} from 'lucide-react'
import Image from 'next/image'

type Step = 1 | 2 | 3 | 4

export default function VerifyPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingVerification, setExistingVerification] = useState<string | null>(null)
  const router = useRouter()

  const [licenseData, setLicenseData] = useState({
    frontImage: null as File | null,
    frontPreview: '',
    backImage: null as File | null,
    backPreview: '',
    licenseNumber: '',
    state: '',
    expiryDate: '',
  })

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkExistingVerification()
  }, [])

  async function checkExistingVerification() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('driver_verifications')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setExistingVerification(data.status)
      if (data.status === 'approved') {
        router.push('/profile')
      }
    }
    setLoading(false)
  }

  function handleFrontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLicenseData({
        ...licenseData,
        frontImage: file,
        frontPreview: URL.createObjectURL(file),
      })
    }
  }

  function handleBackUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLicenseData({
        ...licenseData,
        backImage: file,
        backPreview: URL.createObjectURL(file),
      })
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    try {
      // Upload front image
      const frontExt = licenseData.frontImage?.name.split('.').pop()
      const frontPath = `${user.id}/license-front-${Date.now()}.${frontExt}`
      
      const { error: frontError } = await supabase.storage
        .from('verifications')
        .upload(frontPath, licenseData.frontImage!)

      if (frontError) throw new Error('Failed to upload front image')

      // Upload back image
      const backExt = licenseData.backImage?.name.split('.').pop()
      const backPath = `${user.id}/license-back-${Date.now()}.${backExt}`
      
      const { error: backError } = await supabase.storage
        .from('verifications')
        .upload(backPath, licenseData.backImage!)

      if (backError) throw new Error('Failed to upload back image')

      // Get public URLs
      const { data: { publicUrl: frontUrl } } = supabase.storage
        .from('verifications')
        .getPublicUrl(frontPath)

      const { data: { publicUrl: backUrl } } = supabase.storage
        .from('verifications')
        .getPublicUrl(backPath)

      // Create verification record
      const { error: insertError } = await supabase
        .from('driver_verifications')
        .insert({
          user_id: user.id,
          license_front_url: frontUrl,
          license_back_url: backUrl,
          license_number: licenseData.licenseNumber,
          license_state: licenseData.state,
          license_expiry: licenseData.expiryDate,
          status: 'pending',
        })

      if (insertError) throw new Error('Failed to submit verification')

      // Send notification email to admin via API
      await fetch('/api/notifications/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
        }),
      })

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  if (existingVerification === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold">Verification In Progress</h2>
              <p className="text-muted-foreground">
                Your driver&apos;s license is currently under review. We&apos;ll notify you by email once it&apos;s verified.
              </p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#CC0000] hover:bg-[#CC0000]/90"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (existingVerification === 'rejected') {
    setExistingVerification(null) // Allow resubmission
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Verify Your Driver&apos;s License</h1>
          <p className="text-muted-foreground mt-2">
            Complete verification to rent vehicles on Rent and Drive
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-[#CC0000] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-[#CC0000]' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Upload License Front'}
              {step === 2 && 'Upload License Back'}
              {step === 3 && 'Enter License Details'}
              {step === 4 && 'Verification Submitted'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Take a clear photo of the front of your driver\'s license'}
              {step === 2 && 'Take a clear photo of the back of your driver\'s license'}
              {step === 3 && 'Enter the details from your license'}
              {step === 4 && 'Your verification is under review'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
                {error}
              </div>
            )}

            {/* Step 1: Front Image */}
            {step === 1 && (
              <div className="space-y-4">
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    licenseData.frontPreview
                      ? 'border-[#CC0000] bg-[#CC0000]/5'
                      : 'border-muted-foreground/25 hover:border-[#CC0000]'
                  }`}
                >
                  {licenseData.frontPreview ? (
                    <div className="relative aspect-[1.6/1] max-w-sm mx-auto">
                      <Image
                        src={licenseData.frontPreview}
                        alt="License front"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click to upload or take a photo
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFrontUpload}
                />
                <Button
                  onClick={() => setStep(2)}
                  disabled={!licenseData.frontImage}
                  className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 2: Back Image */}
            {step === 2 && (
              <div className="space-y-4">
                <div
                  onClick={() => backInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    licenseData.backPreview
                      ? 'border-[#CC0000] bg-[#CC0000]/5'
                      : 'border-muted-foreground/25 hover:border-[#CC0000]'
                  }`}
                >
                  {licenseData.backPreview ? (
                    <div className="relative aspect-[1.6/1] max-w-sm mx-auto">
                      <Image
                        src={licenseData.backPreview}
                        alt="License back"
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click to upload or take a photo
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBackUpload}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!licenseData.backImage}
                    className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: License Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseData.licenseNumber}
                    onChange={(e) =>
                      setLicenseData({ ...licenseData, licenseNumber: e.target.value })
                    }
                    placeholder="e.g., D1234567"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={licenseData.state}
                      onChange={(e) =>
                        setLicenseData({ ...licenseData, state: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., NV"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={licenseData.expiryDate}
                      onChange={(e) =>
                        setLicenseData({ ...licenseData, expiryDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !licenseData.licenseNumber ||
                      !licenseData.state ||
                      !licenseData.expiryDate
                    }
                    className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Under Review</h3>
                <p className="text-muted-foreground">
                  Your driver&apos;s license has been submitted for verification.
                  We&apos;ll review it within 24 hours and notify you by email.
                </p>
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
