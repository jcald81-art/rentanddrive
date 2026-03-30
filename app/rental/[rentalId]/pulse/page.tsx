'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const EMOJIS = [
  { emoji: '😠', label: 'Terrible', score: 1 },
  { emoji: '😕', label: 'Poor', score: 2 },
  { emoji: '😐', label: 'Okay', score: 3 },
  { emoji: '😊', label: 'Good', score: 4 },
  { emoji: '😍', label: 'Amazing', score: 5 },
]

const SPECIFIC_OPTIONS = [
  { id: 'vehicle', emoji: '🚗', label: 'Vehicle condition' },
  { id: 'communication', emoji: '💬', label: 'Host communication' },
  { id: 'pickup', emoji: '📍', label: 'Pickup/return' },
  { id: 'value', emoji: '💰', label: 'Value for money' },
  { id: 'extras', emoji: '🎁', label: 'Host extras/tips' },
  { id: 'everything', emoji: '✅', label: 'Everything was great' },
]

export default function RenterPulsePage() {
  const params = useParams()
  const router = useRouter()
  const rentalId = params.rentalId as string

  const [step, setStep] = useState(1)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [selectedSpecific, setSelectedSpecific] = useState<string | null>(null)
  const [openField, setOpenField] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [promptFullReview, setPromptFullReview] = useState(false)

  // Mock rental data
  const rental = {
    vehicle: '2023 Toyota RAV4',
    dates: 'Mar 25-28, 2026',
    hostName: 'Mike R.',
  }

  const handleEmojiSelect = (score: number) => {
    setSelectedEmoji(score)
    // Auto-advance after brief animation
    setTimeout(() => setStep(2), 300)
  }

  const handleSpecificSelect = (id: string) => {
    setSelectedSpecific(id)
    // Auto-advance
    setTimeout(() => setStep(3), 300)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/pulse/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          userType: 'renter',
          emojiRating: selectedEmoji,
          specificFeedback: selectedSpecific,
          openField: openField.trim() || null,
        }),
      })

      const data = await res.json()
      setPromptFullReview(data.promptFullReview)
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
            <p className="text-muted-foreground mb-6">
              Your full review helps the community
            </p>

            {promptFullReview && (
              <Link href={`/rental/${rentalId}/rate/host`}>
                <Button className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 mb-4">
                  Write Full Review
                </Button>
              </Link>
            )}

            <Card className="bg-[#FFD84D]/10 border-[#FFD84D]/30 mt-4">
              <CardContent className="py-4 flex items-center gap-3">
                <Gift className="h-5 w-5 text-[#FFD84D]" />
                <p className="text-sm text-left">
                  Complete a full written review and earn <span className="font-mono font-semibold text-[#FFD84D]">25 DrivePoints</span>
                </p>
              </CardContent>
            </Card>
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
            {rental.vehicle} | {rental.dates} | Host: {rental.hostName}
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
                How was your overall rental experience?
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
                What mattered most?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SPECIFIC_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSpecificSelect(option.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border transition-all',
                      selectedSpecific === option.id
                        ? 'border-[#FFD84D] bg-[#FFD84D]/10 scale-[1.02]'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
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
