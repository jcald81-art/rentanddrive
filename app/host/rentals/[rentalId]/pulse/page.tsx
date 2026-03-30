'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const EMOJIS = [
  { emoji: '😠', label: 'Terrible', score: 1 },
  { emoji: '😕', label: 'Poor', score: 2 },
  { emoji: '😐', label: 'Okay', score: 3 },
  { emoji: '😊', label: 'Good', score: 4 },
  { emoji: '😍', label: 'Amazing', score: 5 },
]

const HOST_SPECIFIC_OPTIONS = [
  { id: 'great_renter', emoji: '🚗', label: 'Great renter / Easy rental' },
  { id: 'on_time', emoji: '⏰', label: 'On time and reliable' },
  { id: 'clean', emoji: '🧼', label: 'Returned clean and full' },
  { id: 'communicator', emoji: '💬', label: 'Great communicator' },
  { id: 'minor_issue', emoji: '⚠️', label: 'Minor issue (resolved)' },
  { id: 'needs_attention', emoji: '🚨', label: 'Needs attention' },
]

export default function HostPulsePage() {
  const params = useParams()
  const rentalId = params.rentalId as string

  const [step, setStep] = useState(1)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [selectedSpecific, setSelectedSpecific] = useState<string | null>(null)
  const [openField, setOpenField] = useState('')
  const [flagForReview, setFlagForReview] = useState(false)
  const [flagDetails, setFlagDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Mock rental data
  const rental = {
    vehicle: '2023 Toyota RAV4',
    dates: 'Mar 25-28, 2026',
    renterName: 'Sarah K.',
  }

  const showFlagOption = selectedSpecific === 'minor_issue' || selectedSpecific === 'needs_attention'

  const handleEmojiSelect = (score: number) => {
    setSelectedEmoji(score)
    setTimeout(() => setStep(2), 300)
  }

  const handleSpecificSelect = (id: string) => {
    setSelectedSpecific(id)
    // Don't auto-advance if needs flag option
    if (id !== 'minor_issue' && id !== 'needs_attention') {
      setTimeout(() => setStep(3), 300)
    }
  }

  const handleContinueToStep3 = () => {
    setStep(3)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      await fetch('/api/pulse/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          userType: 'host',
          emojiRating: selectedEmoji,
          specificFeedback: selectedSpecific,
          openField: openField.trim() || null,
          flagForReview,
          flagDetails: flagForReview ? flagDetails : null,
        }),
      })

      setIsComplete(true)
    } catch (error) {
      console.error('Failed to submit pulse:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-500/30 bg-green-500/5">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Thanks!</h2>
            <p className="text-muted-foreground">
              Your feedback helps us improve the platform.
            </p>
            {flagForReview && (
              <p className="text-sm text-muted-foreground mt-4">
                A support ticket has been created. We&apos;ll review and follow up within 24 hours.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold mb-2">Quick check-in</h1>
          <p className="text-muted-foreground text-sm">Takes 30 seconds</p>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            {rental.vehicle} | {rental.dates} | Renter: {rental.renterName}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                step >= s ? 'bg-[#FFD84D]' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1: Emoji Rating */}
        {step === 1 && (
          <Card className="border-muted">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-6">
                How was this rental overall?
              </p>
              <div className="flex justify-center gap-4">
                {EMOJIS.map((item) => (
                  <button
                    key={item.score}
                    onClick={() => handleEmojiSelect(item.score)}
                    className={cn(
                      'text-4xl transition-all duration-200 hover:scale-110 p-2 rounded-lg',
                      selectedEmoji === item.score && 'scale-125 bg-[#FFD84D]/20 ring-2 ring-[#FFD84D]'
                    )}
                    aria-label={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Specific Feedback */}
        {step === 2 && (
          <Card className="border-muted">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-6">
                What stood out?
              </p>
              <div className="grid grid-cols-1 gap-3">
                {HOST_SPECIFIC_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSpecificSelect(option.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      selectedSpecific === option.id
                        ? 'border-[#FFD84D] bg-[#FFD84D]/10 scale-[1.01]'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>

              {/* Flag for review option */}
              {showFlagOption && (
                <div className="mt-4 p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">Flag this for platform review?</span>
                    <Switch
                      checked={flagForReview}
                      onCheckedChange={setFlagForReview}
                    />
                  </div>
                  {flagForReview && (
                    <Textarea
                      value={flagDetails}
                      onChange={(e) => setFlagDetails(e.target.value)}
                      placeholder="Briefly describe the issue..."
                      className="mt-2"
                      maxLength={100}
                    />
                  )}
                  <Button
                    onClick={handleContinueToStep3}
                    className="w-full mt-3 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Open Field */}
        {step === 3 && (
          <Card className="border-muted">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">
                Anything else? <span className="text-xs">(optional)</span>
              </p>
              <Input
                value={openField}
                onChange={(e) => setOpenField(e.target.value)}
                placeholder="One thing that stood out..."
                className="mb-4"
                maxLength={200}
              />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Pulse'}
              </Button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full text-center text-sm text-muted-foreground mt-3 hover:underline"
              >
                Skip and submit
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
