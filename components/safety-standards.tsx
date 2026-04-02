'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Wrench, 
  Sparkles, 
  Car, 
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Lock,
  Loader2,
  FileText
} from 'lucide-react'

// Current agreement version - update when terms change
const CURRENT_VERSION = '2026.1.0'

interface SafetyStandardsProps {
  onAgree: () => void
  onBack?: () => void
  isLoading?: boolean
  vehicleData?: {
    make?: string
    model?: string
    year?: number
  }
}

const standards = [
  {
    key: 'maintenance',
    icon: Wrench,
    title: 'Vehicle Maintenance',
    description: 'Keep your car well maintained so your guests stay safe on the road. You will be required to pass an annual Inspektlabs inspection to list your car.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'cleanliness',
    icon: Sparkles,
    title: 'Cleanliness & Fuel',
    description: 'Clean and refuel your car before every trip so your guests have an enjoyable experience.',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
  {
    key: 'exclusivity',
    icon: Car,
    title: 'Platform Exclusivity',
    description: 'To maintain a consistent experience, RentAndDrive asks that you do not list the same car on other sharing platforms while it is active on RAD.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'insurance',
    icon: Shield,
    title: 'Insurance Coverage',
    description: 'You must maintain valid auto insurance that covers commercial use or peer-to-peer car sharing as required by your state.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    key: 'registration',
    icon: FileText,
    title: 'Valid Registration',
    description: 'Vehicle must have current, valid registration in your state with no open safety recalls.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
]

export function SafetyStandards({ onAgree, onBack, isLoading = false, vehicleData }: SafetyStandardsProps) {
  const [agreed, setAgreed] = useState(false)
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({})
  const [signature, setSignature] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [alreadySigned, setAlreadySigned] = useState(false)
  const [signedDate, setSignedDate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if already signed on mount
  useEffect(() => {
    checkExistingAgreement()
  }, [])

  async function checkExistingAgreement() {
    try {
      const response = await fetch('/api/host/agreements?type=safety_standards')
      if (response.ok) {
        const data = await response.json()
        if (data.hasSigned) {
          setAlreadySigned(true)
          setSignedDate(data.signedAgreement?.signed_at)
        }
      }
    } catch (err) {
      // Silently fail - user will need to sign
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const allAcknowledged = standards.every(s => acknowledgedItems[s.key])
  const hasValidSignature = signature.trim().length >= 2
  const canSubmit = allAcknowledged && agreed && hasValidSignature

  const toggleItem = (key: string) => {
    setAcknowledgedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit() {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/host/agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementType: 'safety_standards',
          electronicSignature: signature.trim(),
          checkboxesAcknowledged: {
            standards: acknowledgedItems,
            finalAgreement: agreed,
            version: CURRENT_VERSION,
            vehicleData: vehicleData || null
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign agreement')
      }

      // Success - call the parent callback
      onAgree()
    } catch (err: any) {
      setError(err.message || 'Failed to submit agreement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isCheckingStatus) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-border">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Already signed - show confirmation and allow continue
  if (alreadySigned) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-500/30 bg-green-500/5">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Safety Standards Agreed</h3>
                <p className="text-muted-foreground mt-2">
                  You signed the RAD Host Safety Standards Agreement on{' '}
                  <span className="font-medium text-foreground">
                    {signedDate ? new Date(signedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'record'}
                  </span>
                </p>
                <Badge className="mt-4 bg-green-500/20 text-green-600 border-green-500/30">
                  Version {CURRENT_VERSION}
                </Badge>
              </div>
              <Button
                onClick={onAgree}
                className="mt-6 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium h-12 px-8"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Continue to Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-border">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-[#CC0000]" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Safety & Quality Standards
          </CardTitle>
          <CardDescription className="text-base">
            At RAD, we&apos;re committed to providing a safe and high-quality experience for all guests. Please review and acknowledge our standards.
          </CardDescription>
          {vehicleData && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border inline-block mx-auto">
              <p className="text-sm text-muted-foreground">
                Vehicle: <span className="font-medium text-foreground">
                  {vehicleData.year} {vehicleData.make} {vehicleData.model}
                </span>
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}

          {/* Standards List */}
          <div className="space-y-4">
            {standards.map((standard) => (
              <div 
                key={standard.key}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  acknowledgedItems[standard.key] 
                    ? 'border-green-500 bg-green-500/5' 
                    : 'border-border hover:border-[#CC0000]/30'
                }`}
                onClick={() => toggleItem(standard.key)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${standard.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <standard.icon className={`h-6 w-6 ${standard.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{standard.title}</h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        acknowledgedItems[standard.key]
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground/30'
                      }`}>
                        {acknowledgedItems[standard.key] && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {standard.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Important Notice</p>
                <p className="text-sm text-amber-600 mt-1">
                  Failure to meet these standards may result in reduced visibility, suspension, or removal from the RAD platform. We take guest safety seriously.
                </p>
              </div>
            </div>
          </div>

          {/* Final Agreement */}
          <div 
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              agreed ? 'border-[#CC0000] bg-[#CC0000]/5' : 'border-border'
            }`}
            onClick={() => setAgreed(!agreed)}
          >
            <div className="flex items-center gap-3">
              <Checkbox 
                id="agree" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="data-[state=checked]:bg-[#CC0000] data-[state=checked]:border-[#CC0000]"
              />
              <label htmlFor="agree" className="text-sm font-medium text-foreground cursor-pointer">
                I have read and agree to RAD&apos;s Safety & Quality Standards. I understand that my listing may be removed if I fail to maintain these standards.
              </label>
            </div>
          </div>

          {/* Electronic Signature */}
          <div className="p-4 rounded-xl border-2 border-border bg-muted/30 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#CC0000]" />
              <h4 className="font-semibold text-foreground">Electronic Signature</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              By typing your full legal name below, you acknowledge that you have read, understand, 
              and agree to comply with the RAD Host Safety Standards. This electronic signature 
              has the same legal effect as a handwritten signature.
            </p>
            <div className="space-y-2">
              <Label htmlFor="signature" className="text-foreground">
                Type your full legal name
              </Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your Full Legal Name"
                className="bg-background border-border focus:border-[#CC0000]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Agreement Version: {CURRENT_VERSION} | Date: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading || isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isLoading || isSubmitting}
              className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium h-12"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing Agreement...
                </span>
              ) : (
                <>
                  <FileCheck className="h-5 w-5 mr-2" />
                  Sign & Continue
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By signing, you agree to uphold RAD&apos;s commitment to safety and quality.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact badge version for showing agreement status
export function SafetyStandardsBadge({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<'loading' | 'signed' | 'unsigned'>('loading')

  useEffect(() => {
    async function check() {
      try {
        const response = await fetch('/api/host/agreements?type=safety_standards')
        if (response.ok) {
          const data = await response.json()
          setStatus(data.hasSigned ? 'signed' : 'unsigned')
        } else {
          setStatus('unsigned')
        }
      } catch {
        setStatus('unsigned')
      }
    }
    check()
  }, [])

  if (status === 'loading') return null

  if (status === 'signed') {
    return (
      <Badge className={`bg-green-500/20 text-green-600 border-green-500/30 ${className}`}>
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Safety Standards Agreed
      </Badge>
    )
  }

  return (
    <Badge className={`bg-amber-500/20 text-amber-600 border-amber-500/30 ${className}`}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      Agreement Required
    </Badge>
  )
}
