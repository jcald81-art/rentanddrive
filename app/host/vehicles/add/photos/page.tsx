'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Upload, Check, X, AlertCircle, Camera, Sun, Car, Sparkles, Smartphone, QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from 'qrcode.react'

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

// Loading fallback for Suspense
function PhotosPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#CC0000] animate-spin" />
        <p className="text-white/60">Loading photo session...</p>
      </div>
    </div>
  )
}

// Main page component wrapped in Suspense
export default function PhotosPage() {
  return (
    <Suspense fallback={<PhotosPageLoading />}>
      <PhotosPageContent />
    </Suspense>
  )
}

function PhotosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sessionUrl, setSessionUrl] = useState('')
  const [showQrModal, setShowQrModal] = useState(false)
  
  // Detect if opened from QR code scan (mobile mode)
  const isMobileSession = searchParams.get('mobile') === 'true'
  
  // Generate session URL for QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin
      const vehicleId = searchParams.get('vehicleId') || 'new'
      setSessionUrl(`${baseUrl}/host/vehicles/add/photos?mobile=true&vehicleId=${vehicleId}`)
      
      // Check if mobile device
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
  }, [searchParams])

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
    router.push('/host/vehicles/add/availability')
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

      {/* QR Code Section for Desktop - Scan with phone for better photos */}
      {!isMobileSession && !isMobile && (
        <Card className="bg-gradient-to-br from-[#CC0000]/10 to-transparent border-[#CC0000]/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG 
                  value={sessionUrl || 'https://rentanddrive.com'} 
                  size={160}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Smartphone className="w-5 h-5 text-[#CC0000]" />
                  <h3 className="text-lg font-semibold text-white">Take Photos with Your Phone</h3>
                </div>
                <p className="text-white/70 mb-4">
                  Scan this QR code with your smartphone to open the RAD Photo Session. 
                  Take high-quality photos directly with your phone camera and upload seamlessly.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Better camera quality
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    AI-guided angles
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Instant upload
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowQrModal(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Enlarge QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Session Header */}
      {isMobileSession && (
        <Card className="bg-gradient-to-r from-green-500/20 to-transparent border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Mobile Photo Session Active</h3>
                <p className="text-white/70 text-sm">Take photos using your phone camera below</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal for larger view */}
      {showQrModal && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Scan with Your Phone</h3>
            <div className="flex justify-center mb-4">
              <QRCodeSVG 
                value={sessionUrl || 'https://rentanddrive.com'} 
                size={280}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <p className="text-gray-600 mb-4">
              Open your phone&apos;s camera and point it at this QR code to start the mobile photo session.
            </p>
            <Button onClick={() => setShowQrModal(false)} className="bg-[#CC0000] hover:bg-[#CC0000]/90">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Earnings Banner */}
      {dailyRate > 0 && (
        <div className="bg-gradient-to-r from-[#CC0000]/20 to-transparent border border-[#CC0000]/30 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-white/60 text-sm">Your estimated monthly earnings:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#CC0000]">${radEarnings}</span>
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
            <Camera className="w-5 h-5 text-[#CC0000]" />
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

      {/* Upload Zone - Responsive for mobile */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl transition-all
          ${isMobileSession ? 'p-6' : 'p-12'}
          ${isDragging 
            ? 'border-[#CC0000] bg-[#CC0000]/10' 
            : 'border-white/20 hover:border-white/40'
          }
        `}
      >
        {isMobileSession || isMobile ? (
          /* Mobile-optimized upload UI */
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-16 h-16 text-[#CC0000]" />
              <h3 className="text-xl font-semibold text-white">Capture Your Vehicle</h3>
              <p className="text-white/60 text-sm text-center">
                Use your camera to take high-quality photos following the angle guide above
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Take Photo Button - Opens camera */}
              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
                <Button asChild size="lg" className="w-full h-14 bg-[#CC0000] hover:bg-[#CC0000]/90 text-lg">
                  <span className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </span>
                </Button>
              </label>
              
              {/* Upload from Gallery */}
              <label className="w-full">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
                <Button asChild variant="outline" size="lg" className="w-full h-12 border-white/20 text-white hover:bg-white/10">
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Choose from Gallery
                  </span>
                </Button>
              </label>
            </div>
          </div>
        ) : (
          /* Desktop upload UI */
          <div className="text-center">
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
              <Button asChild className="bg-[#CC0000] hover:bg-[#CC0000]/90">
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        )}
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
          className="bg-[#CC0000] hover:bg-[#CC0000]/90 text-white px-8"
        >
          Continue to Availability
        </Button>
      </div>
    </div>
  )
}
