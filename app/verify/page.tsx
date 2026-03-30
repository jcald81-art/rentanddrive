'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Camera,
  FileCheck,
  Clock,
  Smartphone,
  QrCode,
  Mail,
  MessageSquare,
  X
} from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'

type Step = 1 | 2 | 3 | 4

export default function VerifyPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingVerification, setExistingVerification] = useState<string | null>(null)
  const [showMobileHandoff, setShowMobileHandoff] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [sendingLink, setSendingLink] = useState(false)
  const [linkSent, setLinkSent] = useState<'email' | 'sms' | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

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

  useEffect(() => {
    // Check if this is a mobile continuation
    const token = searchParams.get('token')
    if (token) {
      validateMobileToken(token)
    }
  }, [searchParams])

  async function validateMobileToken(token: string) {
    const supabase = createClient()
    
    // Validate the token and get user session
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single()
    
    if (error || !data || new Date(data.expires_at) < new Date()) {
      setError('This link has expired. Please request a new one from your computer.')
      setLoading(false)
      return
    }
    
    // Token is valid, user can continue on phone
    setUserId(data.user_id)
    setLoading(false)
  }

  async function checkExistingVerification() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUserId(user.id)

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

  async function generateMobileLink() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Generate a unique token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store token in database
    await supabase.from('verification_tokens').insert({
      token,
      user_id: user.id,
      expires_at: expiresAt.toISOString(),
    })

    // Generate QR code
    const mobileUrl = `https://rentanddrive.net/verify?token=${token}`
    const qrCode = await QRCode.toDataURL(mobileUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' }
    })
    
    setQrCodeUrl(qrCode)
    setShowMobileHandoff(true)
    
    return { token, mobileUrl }
  }

  async function sendLinkToEmail() {
    setSendingLink(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      setError('No email address found')
      setSendingLink(false)
      return
    }

    const linkData = await generateMobileLink()
    if (!linkData) {
      setSendingLink(false)
      return
    }

    // Send email via API
    await fetch('/api/notifications/mobile-verify-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        link: linkData.mobileUrl,
      }),
    })

    setLinkSent('email')
    setSendingLink(false)
  }

  async function sendLinkToSMS() {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setSendingLink(true)
    const linkData = await generateMobileLink()
    if (!linkData) {
      setSendingLink(false)
      return
    }

    // Send SMS via API
    await fetch('/api/notifications/mobile-verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        link: linkData.mobileUrl,
      }),
    })

    setLinkSent('sms')
    setSendingLink(false)
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
    const currentUserId = userId
    
    if (!currentUserId) {
      router.push('/login')
      return
    }

    try {
      // Upload front image
      const frontExt = licenseData.frontImage?.name.split('.').pop()
      const frontPath = `${currentUserId}/license-front-${Date.now()}.${frontExt}`
      
      const { error: frontError } = await supabase.storage
        .from('verifications')
        .upload(frontPath, licenseData.frontImage!)

      if (frontError) throw new Error('Failed to upload front image')

      // Upload back image
      const backExt = licenseData.backImage?.name.split('.').pop()
      const backPath = `${currentUserId}/license-back-${Date.now()}.${backExt}`
      
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
          user_id: currentUserId,
          license_front_url: frontUrl,
          license_back_url: backUrl,
          license_number: licenseData.licenseNumber,
          license_state: licenseData.state,
          license_expiry: licenseData.expiryDate,
          status: 'pending',
        })

      if (insertError) throw new Error('Failed to submit verification')

      // Clean up used token if any
      const token = searchParams.get('token')
      if (token) {
        await supabase.from('verification_tokens').delete().eq('token', token)
      }

      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Detect if user is on mobile
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
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
                className="bg-[#f97316] hover:bg-[#ea580c]"
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
    setExistingVerification(null)
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

        {/* Continue on Phone Option - Show on desktop */}
        {!isMobile && step === 1 && !showMobileHandoff && (
          <Card className="mb-6 border-[#f97316]/20 bg-[#f97316]/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#f97316]/10 rounded-full">
                  <Smartphone className="h-6 w-6 text-[#f97316]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Continue on your phone?</h3>
                  <p className="text-sm text-muted-foreground">
                    It&apos;s easier to take photos with your phone camera
                  </p>
                </div>
                <Button
                  onClick={generateMobileLink}
                  variant="outline"
                  className="border-[#f97316] text-[#f97316] hover:bg-[#f97316]/10"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Get QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Handoff Modal */}
        {showMobileHandoff && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#f97316]" />
                  Continue on Phone
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowMobileHandoff(false)
                    setLinkSent(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Scan the QR code or get a link sent to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkSent ? (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">
                    {linkSent === 'email' ? 'Check your email!' : 'Check your phone!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a link to continue on your phone. The link expires in 30 minutes.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="text-center space-y-3">
                    <p className="text-sm font-medium">Scan with your phone</p>
                    {qrCodeUrl && (
                      <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                        <Image
                          src={qrCodeUrl}
                          alt="QR Code"
                          width={200}
                          height={200}
                        />
                      </div>
                    )}
                  </div>

                  {/* Send Link Options */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Or send a link</p>
                    
                    <Button
                      onClick={sendLinkToEmail}
                      disabled={sendingLink}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      {sendingLink ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Send to my email
                    </Button>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          type="tel"
                        />
                        <Button
                          onClick={sendLinkToSMS}
                          disabled={sendingLink || !phoneNumber}
                          variant="outline"
                        >
                          {sendingLink ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-[#f97316] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 ${
                    step > s ? 'bg-[#f97316]' : 'bg-muted'
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
                      ? 'border-[#f97316] bg-[#f97316]/5'
                      : 'border-muted-foreground/25 hover:border-[#f97316]'
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
                        {isMobile ? 'Tap to take a photo' : 'Click to upload or take a photo'}
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
                  className="w-full bg-[#f97316] hover:bg-[#ea580c]"
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
                      ? 'border-[#f97316] bg-[#f97316]/5'
                      : 'border-muted-foreground/25 hover:border-[#f97316]'
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
                        {isMobile ? 'Tap to take a photo' : 'Click to upload or take a photo'}
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
                    className="flex-1 bg-[#f97316] hover:bg-[#ea580c]"
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
                    className="flex-1 bg-[#f97316] hover:bg-[#ea580c]"
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
                  className="bg-[#f97316] hover:bg-[#ea580c]"
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
