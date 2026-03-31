'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Lock,
  Car,
  AlertTriangle,
  Info
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface MVRConsentFlowProps {
  userId: string
  onComplete: (result: { status: 'passed' | 'flagged' | 'denied', tier: string }) => void
  onSkip?: () => void
}

export function MVRConsentFlow({ userId, onComplete, onSkip }: MVRConsentFlowProps) {
  const [fcraAcknowledged, setFcraAcknowledged] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFCRADialog, setShowFCRADialog] = useState(false)

  async function handleSubmitConsent() {
    if (!fcraAcknowledged || !consentGiven) {
      setError('Please acknowledge the disclosure and provide consent to continue.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/verify/mvr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fcraAcknowledged,
          consentGiven,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process MVR check')
      }

      onComplete({
        status: data.mvrStatus,
        tier: data.mvrTier,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
          <Car className="h-8 w-8 text-[#CC0000]" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Driving Record Check</h2>
        <p className="text-muted-foreground">
          We check your Motor Vehicle Record to ensure safe rentals for everyone.
        </p>
      </div>

      {/* What We Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            What We Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>License status (valid, expired, suspended)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Moving violations in the past 3 years</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>DUI/DWI history</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>At-fault accidents</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Tier Explanation */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tiers">
          <AccordionTrigger className="text-sm">
            How does the scoring work?
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Badge className="bg-green-500 text-white">Green</Badge>
                <div>
                  <p className="font-medium">Clean Record</p>
                  <p className="text-muted-foreground">0-1 minor violations. Full access to all vehicles.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Badge className="bg-yellow-500 text-white">Yellow</Badge>
                <div>
                  <p className="font-medium">Minor Issues</p>
                  <p className="text-muted-foreground">2-3 violations. Host may review before approval.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Badge className="bg-red-500 text-white">Red</Badge>
                <div>
                  <p className="font-medium">Needs Review</p>
                  <p className="text-muted-foreground">4+ violations or recent at-fault accident. Host approval required.</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* FCRA Disclosure */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            FCRA Disclosure
          </CardTitle>
          <CardDescription>
            Required by federal law before running a background check
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-sm max-h-48 overflow-y-auto">
            <p className="font-medium mb-2">Summary of Your Rights Under the Fair Credit Reporting Act</p>
            <p className="text-muted-foreground mb-3">
              The federal Fair Credit Reporting Act (FCRA) promotes the accuracy, fairness, and privacy of 
              information in the files of consumer reporting agencies. A summary of your major rights under 
              FCRA is provided below.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• You have the right to receive a copy of your consumer report.</li>
              <li>• You have the right to dispute incomplete or inaccurate information.</li>
              <li>• Consumer reporting agencies must correct or delete inaccurate information.</li>
              <li>• You may limit prescreened offers of credit and insurance you receive.</li>
            </ul>
            <Dialog open={showFCRADialog} onOpenChange={setShowFCRADialog}>
              <DialogTrigger asChild>
                <Button variant="link" className="p-0 h-auto mt-2">
                  Read full FCRA disclosure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Fair Credit Reporting Act Disclosure</DialogTitle>
                  <DialogDescription>
                    A Summary of Your Rights Under the Fair Credit Reporting Act
                  </DialogDescription>
                </DialogHeader>
                <div className="prose prose-sm">
                  <p>
                    The federal Fair Credit Reporting Act (FCRA) promotes the accuracy, fairness, and 
                    privacy of information in the files of consumer reporting agencies. There are many 
                    types of consumer reporting agencies, including credit bureaus and specialty agencies 
                    (such as agencies that sell information about check writing histories, medical records, 
                    and rental history records).
                  </p>
                  <h4>Your Rights Include:</h4>
                  <ul>
                    <li><strong>Right to Know What Is in Your File.</strong> You have the right to know what 
                    information is in your file.</li>
                    <li><strong>Right to Dispute.</strong> You have the right to dispute incomplete or 
                    inaccurate information.</li>
                    <li><strong>Right to Have Errors Corrected.</strong> Consumer reporting agencies must 
                    correct or delete inaccurate, incomplete, or unverifiable information.</li>
                    <li><strong>Right to Seek Damages.</strong> You may seek damages from violators in state 
                    or federal court.</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    For questions or concerns regarding this disclosure, contact the Federal Trade Commission 
                    at www.ftc.gov or 1-877-FTC-HELP.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="fcra" 
              checked={fcraAcknowledged}
              onCheckedChange={(checked) => setFcraAcknowledged(checked === true)}
            />
            <label htmlFor="fcra" className="text-sm leading-relaxed cursor-pointer">
              I acknowledge that I have received and reviewed the FCRA disclosure above, and I understand 
              my rights under the Fair Credit Reporting Act.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Consent */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#CC0000]" />
            Authorization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="consent" 
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
            />
            <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              I authorize Rent and Drive and its designated consumer reporting agency to obtain my 
              Motor Vehicle Record (MVR) from state DMV databases. I understand this check will be 
              performed annually as long as I remain an active renter. I certify that the information 
              I have provided is true and complete.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="space-y-3">
        <Button 
          onClick={handleSubmitConsent}
          disabled={submitting || !fcraAcknowledged || !consentGiven}
          className="w-full bg-[#CC0000] hover:bg-[#AA0000] h-12"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking Driving Record...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Authorize MVR Check
            </>
          )}
        </Button>

        {onSkip && (
          <Button 
            variant="ghost" 
            onClick={onSkip}
            className="w-full text-muted-foreground"
            disabled={submitting}
          >
            Skip for now (some vehicles may be unavailable)
          </Button>
        )}
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-center text-muted-foreground">
        <Lock className="inline h-3 w-3 mr-1" />
        Your MVR data is encrypted and only shared with hosts when you request a booking.
        We never sell your personal information.
      </p>
    </div>
  )
}
