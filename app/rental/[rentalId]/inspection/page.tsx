'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Camera, CheckCircle2, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DriveShieldResult } from '@/components/DriveShieldResult'

const REQUIRED_ANGLES = [
  { id: 'front', label: 'Front', description: 'Full front view of the vehicle' },
  { id: 'rear', label: 'Rear', description: 'Full rear view of the vehicle' },
  { id: 'driver_side', label: 'Driver Side', description: 'Full left side profile' },
  { id: 'passenger_side', label: 'Passenger Side', description: 'Full right side profile' },
  { id: 'interior', label: 'Interior', description: 'Front seats and dashboard' },
  { id: 'odometer', label: 'Odometer', description: 'Dashboard showing mileage' },
]

interface Photo {
  angle: string
  file: File | null
  preview: string | null
  uploaded: boolean
}

export default function InspectionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const rentalId = params.rentalId as string
  const mode = searchParams.get('mode') || 'pre'
  const isPre = mode === 'pre'

  const [photos, setPhotos] = useState<Photo[]>(
    REQUIRED_ANGLES.map((angle) => ({
      angle: angle.id,
      file: null,
      preview: null,
      uploaded: false,
    }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [vehicleInfo] = useState({ year: 2023, make: 'Toyota', model: '4Runner' })

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const photosCompleted = photos.filter((p) => p.preview).length
  const allPhotosComplete = photosCompleted === REQUIRED_ANGLES.length
  const progressPercent = (photosCompleted / REQUIRED_ANGLES.length) * 100

  const handlePhotoCapture = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          file,
          preview: reader.result as string,
          uploaded: true,
        }
        return updated
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Stub: Capture timestamp and GPS
    const timestamp = new Date().toISOString()
    // const coordinates = await getCurrentPosition() // TODO: Implement geolocation

    try {
      const response = await fetch('/api/inspection/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId,
          mode,
          photos: photos.map((p) => ({
            angle: p.angle,
            dataUrl: p.preview,
          })),
          timestamp,
          coordinates: { lat: 39.5296, lng: -119.8138 }, // Reno, NV stub
        }),
      })

      const data = await response.json()

      if (!isPre && data.inspectionId) {
        // Trigger AI analysis for post-rental
        setIsAnalyzing(true)
        const analysisRes = await fetch('/api/inspection/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preInspectionId: data.preInspectionId,
            postInspectionId: data.inspectionId,
          }),
        })
        const analysisData = await analysisRes.json()
        setAnalysisResult(analysisData)
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('Inspection submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show analysis result for post-rental
  if (analysisResult) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Inspection Complete</h1>
            <p className="text-muted-foreground">
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
            </p>
          </div>
          <DriveShieldResult
            clean={analysisResult.clean}
            flaggedAngles={analysisResult.flaggedAngles || []}
            analyzedAt={analysisResult.analyzedAt}
            onDispute={() => console.log('Dispute submitted')}
            onAccept={() => console.log('Accepted')}
          />
        </div>
      </div>
    )
  }

  // Analyzing state with pulsing animation
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FFD84D]/10 animate-pulse">
            <Shield className="h-12 w-12 text-[#FFD84D]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analyzing for damage...</h2>
          <p className="text-muted-foreground">DriveShield is comparing your photos</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#FFD84D]" />
            <span className="text-sm text-muted-foreground">This usually takes 10-15 seconds</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">
            {isPre ? 'Pre-Rental' : 'Post-Rental'} Inspection
          </h1>
          <p className="text-sm text-muted-foreground">
            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Instructions */}
        <Card className="mb-6 bg-muted/20 border-[#FFD84D]/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-[#FFD84D] mt-0.5" />
              <div>
                <p className="font-medium text-[#FFD84D]">DriveShield Protection</p>
                <p className="text-sm text-muted-foreground">
                  {isPre
                    ? 'Take 6 photos before you drive. This protects you from false damage claims.'
                    : 'Return the car in the condition you received it. We\'ll compare these photos to your pre-rental inspection.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {photosCompleted} of {REQUIRED_ANGLES.length} photos taken
            </span>
            <span className="text-sm text-muted-foreground font-mono">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {REQUIRED_ANGLES.map((angle, index) => {
            const photo = photos[index]
            const hasPhoto = !!photo.preview

            return (
              <div key={angle.id}>
                <input
                  ref={(el) => { fileInputRefs.current[index] = el }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoCapture(index, e)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className={`
                    w-full aspect-[4/3] rounded-lg border-2 border-dashed transition-all
                    flex flex-col items-center justify-center gap-2 relative overflow-hidden
                    ${hasPhoto
                      ? 'border-[#22C55E] bg-[#22C55E]/5'
                      : 'border-muted-foreground/30 bg-muted/10 hover:border-[#FFD84D] hover:bg-[#FFD84D]/5'
                    }
                  `}
                >
                  {hasPhoto ? (
                    <>
                      <img
                        src={photo.preview!}
                        alt={angle.label}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-[#22C55E] rounded-full p-1">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">{angle.label}</span>
                      <span className="text-xs text-muted-foreground">Tap to photograph</span>
                    </>
                  )}
                </button>
                {hasPhoto && (
                  <p className="text-center text-xs text-[#22C55E] mt-1 font-medium">
                    {angle.label} captured
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!allPhotosComplete || isSubmitting}
          className="w-full h-14 text-lg bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-black font-semibold disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            `Complete ${isPre ? 'Pre' : 'Post'}-Rental Inspection`
          )}
        </Button>

        {!allPhotosComplete && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            Please take all 6 photos to continue
          </p>
        )}
      </div>
    </div>
  )
}
