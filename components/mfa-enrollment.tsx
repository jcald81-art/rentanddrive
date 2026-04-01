'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Shield, 
  ShieldCheck, 
  Smartphone, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Copy,
  Check
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface MFAEnrollmentProps {
  onClose?: () => void
  showAsCard?: boolean
  compact?: boolean
}

export function MFAEnrollment({ onClose, showAsCard = true, compact = false }: MFAEnrollmentProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [unenrolling, setUnenrolling] = useState(false)
  
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  async function checkMFAStatus() {
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors()
      
      if (error) throw error
      
      // Check for verified TOTP factors
      const verifiedFactor = factors.totp?.find(f => f.status === 'verified')
      setMfaEnabled(!!verifiedFactor)
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id)
      }
    } catch (err) {
      console.error('Error checking MFA status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll() {
    setEnrolling(true)
    setError(null)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      })
      
      if (error) throw error
      
      if (data) {
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      }
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Failed to start MFA enrollment')
    } finally {
      setEnrolling(false)
    }
  }

  async function handleVerify() {
    if (!factorId || verifyCode.length !== 6) return
    
    setVerifying(true)
    setError(null)
    const supabase = createClient()
    
    try {
      // First challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      })
      
      if (challengeError) throw challengeError
      
      // Then verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      })
      
      if (verifyError) throw verifyError
      
      setMfaEnabled(true)
      setQrCode(null)
      setSecret(null)
      setVerifyCode('')
      setSuccess('MFA enabled successfully! Your account is now more secure.')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Invalid verification code. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleUnenroll() {
    if (!factorId) return
    
    setUnenrolling(true)
    setError(null)
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      })
      
      if (error) throw error
      
      setMfaEnabled(false)
      setFactorId(null)
      setSuccess('MFA has been disabled.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Failed to disable MFA')
    } finally {
      setUnenrolling(false)
    }
  }

  function copySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function cancelEnrollment() {
    setQrCode(null)
    setSecret(null)
    setVerifyCode('')
    setError(null)
    // Unenroll the unverified factor
    if (factorId && !mfaEnabled) {
      const supabase = createClient()
      supabase.auth.mfa.unenroll({ factorId })
      setFactorId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Compact badge display for dashboard
  if (compact) {
    return mfaEnabled ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <ShieldCheck className="w-3 h-3 mr-1" />
        MFA Enabled
      </Badge>
    ) : null
  }

  const content = (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mfaEnabled ? (
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-500" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">
              {mfaEnabled ? 'MFA is enabled' : 'MFA is disabled'}
            </p>
            <p className="text-sm text-muted-foreground">
              {mfaEnabled 
                ? 'Your account has extra protection'
                : 'Add an extra layer of security'
              }
            </p>
          </div>
        </div>
        
        {!qrCode && (
          <Switch
            checked={mfaEnabled}
            onCheckedChange={(checked) => {
              if (checked && !mfaEnabled) {
                handleEnroll()
              } else if (!checked && mfaEnabled) {
                handleUnenroll()
              }
            }}
            disabled={enrolling || unenrolling}
            className="data-[state=checked]:bg-green-500"
          />
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Enrollment Flow */}
      {qrCode && !mfaEnabled && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Scan with Google Authenticator, Authy, or similar app</span>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-xl">
            <QRCodeSVG 
              value={qrCode} 
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Or enter this code manually:
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
              <code className="flex-1 text-xs font-mono text-foreground break-all">
                {secret}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copySecret}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="space-y-2">
            <Label htmlFor="verifyCode">Enter 6-digit code from your app</Label>
            <div className="flex gap-2">
              <Input
                id="verifyCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest font-mono"
              />
              <Button 
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || verifying}
                className="bg-[#CC0000] hover:bg-[#CC0000]/90"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>

          {/* Cancel Button */}
          <Button 
            variant="ghost" 
            onClick={cancelEnrollment}
            className="w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Benefits when not enrolled */}
      {!mfaEnabled && !qrCode && (
        <div className="pt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            MFA protects your account with an authenticator app. Even if someone 
            gets your password, they can&apos;t access your account without your phone.
          </p>
        </div>
      )}
    </div>
  )

  if (!showAsCard) {
    return content
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Protect your account with an authenticator app
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  )
}

// MFA Prompt Banner for hosts
export function MFAPromptBanner({ onDismiss, onSetup }: { onDismiss: () => void; onSetup: () => void }) {
  return (
    <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">
              Enable MFA for extra security
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Protect your vehicles and earnings with two-factor authentication. 
              Takes just 30 seconds to set up.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                onClick={onSetup}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Shield className="h-4 w-4 mr-1" />
                Enable Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDismiss}
                className="text-muted-foreground"
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Security Badge for dashboard
export function MFASecurityBadge() {
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verified = factors?.totp?.some(f => f.status === 'verified')
      setMfaEnabled(!!verified)
    }
    check()
  }, [])

  if (mfaEnabled === null) return null
  
  return mfaEnabled ? (
    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
      <ShieldCheck className="w-3 h-3 mr-1" />
      MFA Protected
    </Badge>
  ) : null
}
