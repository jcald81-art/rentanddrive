'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Brush, CreditCard, FileText, MessageSquare, Ruler, Wrench, HelpCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

const DISPUTE_TYPES = [
  { id: 'late_return', icon: Clock, emoji: '⏰', label: 'Late Return', description: 'Renter returned late, causing issues' },
  { id: 'cleanliness', icon: Brush, emoji: '🧹', label: 'Cleanliness', description: 'Vehicle returned dirty or damaged' },
  { id: 'charge', icon: CreditCard, emoji: '💳', label: 'Charge Dispute', description: 'I was charged incorrectly' },
  { id: 'listing', icon: FileText, emoji: '📋', label: 'Listing Accuracy', description: "Vehicle wasn't as described" },
  { id: 'communication', icon: MessageSquare, emoji: '💬', label: 'Communication', description: 'Host/renter was unresponsive' },
  { id: 'mileage', icon: Ruler, emoji: '📏', label: 'Mileage', description: 'Mileage limit dispute' },
  { id: 'addon', icon: Wrench, emoji: '🔧', label: 'Add-On Issue', description: "Add-on wasn't available/working" },
  { id: 'other', icon: HelpCircle, emoji: '❓', label: 'Other', description: 'Something else happened' },
]

const DESIRED_OUTCOMES = [
  { id: 'refund', emoji: '💵', label: 'Refund amount' },
  { id: 'exchange', emoji: '🔄', label: 'Exchange / swap' },
  { id: 'conversation', emoji: '📞', label: 'Direct conversation with other party' },
  { id: 'acknowledgment', emoji: '✅', label: 'Formal acknowledgment' },
  { id: 'unsure', emoji: '🤷', label: 'Not sure — please help me decide' },
]

export default function NewDisputePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')

  // Form state
  const [disputeType, setDisputeType] = useState('')
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentTime, setIncidentTime] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (evidenceFiles.length + files.length <= 6) {
      setEvidenceFiles([...evidenceFiles, ...files])
    }
  }

  const removeFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/dispute/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeType,
          description,
          incidentDate,
          incidentTime,
          desiredOutcome,
          refundAmount: desiredOutcome === 'refund' ? parseFloat(refundAmount) : null,
          evidenceCount: evidenceFiles.length,
        }),
      })

      const data = await res.json()
      setReferenceNumber(data.referenceNumber)
      setStep(5) // Confirmation step
    } catch (error) {
      console.error('Failed to create dispute:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirmation step
  if (step === 5) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="border-[#FFD84D]/30 bg-[#FFD84D]/5">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="mb-6 text-5xl">📋</div>
              <h2 className="text-xl font-semibold mb-2">Dispute Opened</h2>
              <p className="font-mono text-lg text-[#FFD84D] mb-4">{referenceNumber}</p>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                The other party has been notified and has 48 hours to respond before our AI mediator steps in.
              </p>
              <Button
                onClick={() => router.push(`/dispute/${referenceNumber}`)}
                className="mt-6 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
              >
                View Dispute
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Open a Dispute</h1>
          <p className="text-muted-foreground">DriveMediate helps resolve issues fairly</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 flex-1 max-w-16 rounded-full transition-colors',
                step >= s ? 'bg-[#FFD84D]' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1: Dispute Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">What&apos;s this dispute about?</h2>
            <div className="grid grid-cols-2 gap-3">
              {DISPUTE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setDisputeType(type.id)
                    setStep(2)
                  }}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all',
                    disputeType === type.id
                      ? 'border-[#FFD84D] bg-[#FFD84D]/10'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                >
                  <span className="text-2xl mb-2 block">{type.emoji}</span>
                  <span className="font-medium block">{type.label}</span>
                  <span className="text-sm text-muted-foreground">{type.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Your Side */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Describe what happened</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Your description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the situation in detail..."
                    className="mt-2 min-h-32"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>When did this occur?</Label>
                    <Input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Time (optional)</Label>
                    <Input
                      type="time"
                      value={incidentTime}
                      onChange={(e) => setIncidentTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Add photos or screenshots (up to 6)</Label>
                  <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="evidence-upload"
                    />
                    <label
                      htmlFor="evidence-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload evidence
                      </span>
                    </label>
                  </div>
                  {evidenceFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {evidenceFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative bg-muted rounded-lg px-3 py-1 text-sm flex items-center gap-2"
                        >
                          {file.name.slice(0, 20)}...
                          <button
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={!description || !incidentDate}
                  className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Desired Outcome */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">What would resolve this for you?</h2>
            <Card>
              <CardContent className="pt-6">
                <RadioGroup value={desiredOutcome} onValueChange={setDesiredOutcome}>
                  {DESIRED_OUTCOMES.map((outcome) => (
                    <div
                      key={outcome.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
                        desiredOutcome === outcome.id
                          ? 'border-[#FFD84D] bg-[#FFD84D]/10'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                      onClick={() => setDesiredOutcome(outcome.id)}
                    >
                      <RadioGroupItem value={outcome.id} id={outcome.id} />
                      <span className="text-xl">{outcome.emoji}</span>
                      <Label htmlFor={outcome.id} className="cursor-pointer flex-1">
                        {outcome.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {desiredOutcome === 'refund' && (
                  <div className="mt-4">
                    <Label>Refund amount</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="pl-7 font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setStep(4)}
                  disabled={!desiredOutcome || (desiredOutcome === 'refund' && !refundAmount)}
                  className="w-full mt-6 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review your dispute</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">
                      {DISPUTE_TYPES.find(t => t.id === disputeType)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Incident Date</span>
                    <p className="font-medium font-mono">{incidentDate}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1">{description}</p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Desired Outcome</span>
                  <p className="font-medium">
                    {DESIRED_OUTCOMES.find(o => o.id === desiredOutcome)?.label}
                    {desiredOutcome === 'refund' && ` — $${refundAmount}`}
                  </p>
                </div>

                {evidenceFiles.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Evidence</span>
                    <p className="font-medium">{evidenceFiles.length} file(s) attached</p>
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    By submitting, you agree to the DriveMediate process — both parties participate in good faith.
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Back button */}
        {step > 1 && step < 5 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-4 text-sm text-muted-foreground hover:underline"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
