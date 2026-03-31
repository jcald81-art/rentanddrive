'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, X, AlertCircle, Camera, Sun, Car, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const REQUIRED_ANGLES = [
  { id: 'front', label: 'Front', description: 'Straight on, whole car visible' },
  { id: 'front_quarter', label: '3/4 Front', description: 'Front corner angle' },
  { id: 'left', label: 'Left Side', description: 'Driver side profile' },
  { id: 'right', label: 'Right Side', description: 'Passenger side profile' },
  { id: 'back', label: 'Back', description: 'Straight on rear view' },
  { id: 'back_quarter', label: '3/4 Back', description: 'Rear corner angle' },
  { id: 'dashboard', label: 'Dashboard', description: 'Interior dashboard view' },
  { id: 'backseat', label: 'Back Seat', description: 'Rear passenger area' },
  { id: 'trunk', label: 'Trunk', description: 'Cargo/trunk space open' },
]

interface PhotoUpload {
  id: string
  file: File
  preview: string
  quality: 'excellent' | 'good' | 'needs_retake' | 'uploading' | 'error'
  issues: string[]
  angle?: string
}

export default function PhotosPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        setListingData(JSON.parse(draft))
      } catch {}
    }
  }, [])

  // Save photos to draft
  const saveDraft = useCallback(() => {
    if (listingData) {
      const photoUrls = photos
        .filter(p => p.quality !== 'error' && p.quality !== 'needs_retake')
        .map(p => p.preview)
      localStorage.setItem('rad-listing-draft', JSON.stringify({
        ...listingData,
        photos: photoUrls,
      }))
    }
  }, [listingData, photos])

  useEffect(() => {
    saveDraft()
  }, [photos, saveDraft])

  // Validate photo
  const validatePhoto = async (photo: PhotoUpload) => {
    const formData = new FormData()
    formData.append('image', photo.file)

    try {
      const response = await fetch('/api/vehicles/validate-photo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      setPhotos(prev => prev.map(p => 
        p.id === photo.id 
          ? { 
              ...p, 
              quality: result.quality || 'good',
              issues: result.issues || [],
              angle: result.detectedAngle,
            }
          : p
      ))
    } catch {
      setPhotos(prev => prev.map(p => 
        p.id === photo.id 
          ? { ...p, quality: 'error', issues: ['Failed to validate'] }
          : p
      ))
    }
  }

  // Handle file upload
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    const newPhotos: PhotoUpload[] = fileArray.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      quality: 'uploading',
      issues: [],
    }))

    setPhotos(prev => [...prev, ...newPhotos])

    // Validate each photo
    for (const photo of newPhotos) {
      await validatePhoto(photo)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // Remove photo
  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  // Calculate progress
  const validPhotos = photos.filter(p => p.quality === 'excellent' || p.quality === 'good')
  const progress = Math.min(100, (validPhotos.length / 6) * 100)
  const canContinue = validPhotos.length >= 6

  const handleContinue = () => {
    saveDraft()
    router.push('/host/vehicles/add/payout')
  }

  // Earnings display
  const dailyRate = listingData?.daily_rate ? parseFloat(String(listingData.daily_rate)) : 0
  const radEarnings = Math.round(dailyRate * 15 * 0.90)
  const turoEarnings = Math.round(dailyRate * 15 * 0.70)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Upload Photos</h1>
        <p className="text-white/60">
          High-quality photos get 3x more bookings. Minimum 6 photos required.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white">{validPhotos.length} of 9 angles covered</span>
          <span className={validPhotos.length >= 6 ? 'text-green-400' : 'text-white/60'}>
            {validPhotos.length >= 6 ? 'Ready to continue' : `${6 - validPhotos.length} more needed`}
          </span>
        </div>
        <Progress value={progress} className="h-2 bg-white/10" />
      </div>

      {/* Earnings Banner */}
      {dailyRate > 0 && (
        <div className="bg-gradient-to-r from-[#e63946]/20 to-transparent border border-[#e63946]/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-white/60 text-sm">Your estimated monthly earnings:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#e63946]">${radEarnings}</span>
              <span className="text-white/40 line-through">${turoEarnings} Turo</span>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            +${radEarnings - turoEarnings}/mo more
          </Badge>
        </div>
      )}

      {/* Required Angles Guide */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#e63946]" />
            Required Angles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {REQUIRED_ANGLES.map(angle => {
              const matchingPhoto = photos.find(p => 
                p.angle === angle.id || 
                p.file.name.toLowerCase().includes(angle.id.replace('_', ''))
              )
              const isCovered = matchingPhoto && (matchingPhoto.quality === 'excellent' || matchingPhoto.quality === 'good')

              return (
                <div
                  key={angle.id}
                  className={`
                    relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 text-center
                    ${isCovered 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-white/20 bg-white/5'
                    }
                  `}
                >
                  {isCovered && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                  <Car className={`w-6 h-6 mb-1 ${isCovered ? 'text-green-400' : 'text-white/40'}`} />
                  <span className={`text-xs ${isCovered ? 'text-green-400' : 'text-white/60'}`}>
                    {angle.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${isDragging 
            ? 'border-[#e63946] bg-[#e63946]/10' 
            : 'border-white/20 hover:border-white/40'
          }
        `}
      >
        <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Drag and drop photos here</p>
        <p className="text-white/60 text-sm mb-4">or</p>
        <label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <Button asChild className="bg-[#e63946] hover:bg-[#e63946]/80">
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.preview}
                alt="Vehicle photo"
                className="w-full aspect-[4/3] object-cover rounded-lg"
              />
              
              {/* Quality Badge */}
              <div className="absolute top-2 left-2">
                {photo.quality === 'uploading' && (
                  <Badge className="bg-blue-500/80">Checking...</Badge>
                )}
                {photo.quality === 'excellent' && (
                  <Badge className="bg-green-500/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Excellent
                  </Badge>
                )}
                {photo.quality === 'good' && (
                  <Badge className="bg-yellow-500/80">Good</Badge>
                )}
                {photo.quality === 'needs_retake' && (
                  <Badge className="bg-red-500/80 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Retake
                  </Badge>
                )}
                {photo.quality === 'error' && (
                  <Badge className="bg-red-500/80">Error</Badge>
                )}
              </div>

              {/* Issues */}
              {photo.issues.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 rounded-b-lg">
                  <p className="text-red-400 text-xs">{photo.issues[0]}</p>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tips Sidebar */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-400" />
            Photo Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-white/80 text-sm">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Shoot in daylight for best results
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Capture the whole car in each frame
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Choose an open, scenic location
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Clean interior before shooting
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-between pb-20 sm:pb-0">
        <Button
          variant="outline"
          onClick={() => router.push('/host/vehicles/add/details')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-8"
        >
          Continue to Payout
        </Button>
      </div>
    </div>
  )
}
