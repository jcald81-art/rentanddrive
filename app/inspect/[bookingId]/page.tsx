'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Camera, CheckCircle, AlertTriangle, ChevronRight, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const REQUIRED_ANGLES = [
  { id: 'front', label: 'Front', description: 'Full front view including bumper and hood' },
  { id: 'rear', label: 'Rear', description: 'Full rear view including bumper and trunk' },
  { id: 'driver_side', label: 'Driver Side', description: 'Full driver side profile' },
  { id: 'passenger_side', label: 'Passenger Side', description: 'Full passenger side profile' },
  { id: 'dashboard', label: 'Dashboard', description: 'Dashboard and odometer reading' },
  { id: 'interior_front', label: 'Front Interior', description: 'Front seats and center console' },
  { id: 'interior_rear', label: 'Rear Interior', description: 'Rear seats and floor' },
  { id: 'trunk', label: 'Trunk/Cargo', description: 'Trunk or cargo area' },
]

interface PhotoCapture {
  angle: string
  url: string
  damageDetected?: boolean
  damageDescription?: string
}

export default function InspectionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.bookingId as string
  const type = searchParams.get('type') === 'post' ? 'post' : 'pre'
  
  const [step, setStep] = useState<'intro' | 'photos' | 'notes' | 'signature' | 'complete'>('intro')
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0)
  const [photos, setPhotos] = useState<PhotoCapture[]>([])
  const [notes, setNotes] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [inspectionId, setInspectionId] = useState<string | null>(null)
  const [damagesFound, setDamagesFound] = useState<PhotoCapture[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  const progress = (photos.length / REQUIRED_ANGLES.length) * 100
  const currentAngle = REQUIRED_ANGLES[currentAngleIndex]
  
  // Start camera
  useEffect(() => {
    if (step === 'photos') {
      startCamera()
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [step])
  
  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      toast.error('Camera access denied. Please enable camera permissions.')
    }
  }
  
  async function startInspection() {
    try {
      const response = await fetch('/api/inspections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, type })
      })
      const data = await response.json()
      setInspectionId(data.inspectionId)
      setStep('photos')
    } catch (error) {
      toast.error('Failed to start inspection')
    }
  }
  
  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || !currentAngle) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context?.drawImage(video, 0, 0)
    
    const photoUrl = canvas.toDataURL('image/jpeg', 0.8)
    
    // Analyze photo for damage
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/inspections/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          photoUrl,
          angle: currentAngle.id,
        })
      })
      const analysis = await response.json()
      
      const capture: PhotoCapture = {
        angle: currentAngle.id,
        url: photoUrl,
        damageDetected: analysis.damageFound,
        damageDescription: analysis.description,
      }
      
      setPhotos(prev => [...prev, capture])
      
      if (analysis.damageFound) {
        setDamagesFound(prev => [...prev, capture])
        toast.warning(`Damage detected: ${analysis.description}`)
      } else {
        toast.success('Photo captured successfully')
      }
      
      // Move to next angle or finish
      if (currentAngleIndex < REQUIRED_ANGLES.length - 1) {
        setCurrentAngleIndex(prev => prev + 1)
      } else {
        // All photos taken
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }
        setStep('notes')
      }
    } catch (error) {
      toast.error('Failed to analyze photo')
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  function skipPhoto() {
    if (currentAngleIndex < REQUIRED_ANGLES.length - 1) {
      setCurrentAngleIndex(prev => prev + 1)
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      setStep('notes')
    }
  }
  
  // Signature canvas drawing
  useEffect(() => {
    if (step === 'signature' && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      let isDrawing = false
      let lastX = 0
      let lastY = 0
      
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      
      const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return
        const rect = canvas.getBoundingClientRect()
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top
        
        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(x, y)
        ctx.stroke()
        lastX = x
        lastY = y
      }
      
      const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true
        const rect = canvas.getBoundingClientRect()
        lastX = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        lastY = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top
      }
      
      const stopDrawing = () => {
        isDrawing = false
        setSignature(canvas.toDataURL())
      }
      
      canvas.addEventListener('mousedown', startDrawing)
      canvas.addEventListener('mousemove', draw)
      canvas.addEventListener('mouseup', stopDrawing)
      canvas.addEventListener('touchstart', startDrawing)
      canvas.addEventListener('touchmove', draw)
      canvas.addEventListener('touchend', stopDrawing)
      
      return () => {
        canvas.removeEventListener('mousedown', startDrawing)
        canvas.removeEventListener('mousemove', draw)
        canvas.removeEventListener('mouseup', stopDrawing)
        canvas.removeEventListener('touchstart', startDrawing)
        canvas.removeEventListener('touchmove', draw)
        canvas.removeEventListener('touchend', stopDrawing)
      }
    }
  }, [step])
  
  async function completeInspection() {
    if (!signature) {
      toast.error('Please sign to complete the inspection')
      return
    }
    
    try {
      const response = await fetch('/api/inspections/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          signature,
          notes,
        })
      })
      const result = await response.json()
      
      if (result.newDamageFound) {
        toast.warning('New damage was detected and has been reported.')
      }
      
      setStep('complete')
    } catch (error) {
      toast.error('Failed to complete inspection')
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#CC0000]" />
            <span className="font-semibold">Cartegrity</span>
          </div>
          <Badge variant={type === 'pre' ? 'default' : 'secondary'}>
            {type === 'pre' ? 'Pre-Rental' : 'Post-Rental'} Inspection
          </Badge>
        </div>
      </header>
      
      <main className="container max-w-lg mx-auto px-4 py-6">
        {/* Intro Step */}
        {step === 'intro' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Vehicle Inspection</CardTitle>
              <CardDescription>
                {type === 'pre' 
                  ? 'Document the vehicle condition before your trip'
                  : 'Document the vehicle condition after your trip'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">What you&apos;ll need to do:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    Take photos from 8 required angles
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    AI will automatically detect any damage
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    Add any notes about the vehicle condition
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                    Sign to confirm the inspection
                  </li>
                </ul>
              </div>
              
              <Button onClick={startInspection} className="w-full bg-[#CC0000] hover:bg-[#AA0000]">
                Start Inspection
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Photos Step */}
        {step === 'photos' && currentAngle && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Photo {currentAngleIndex + 1} of {REQUIRED_ANGLES.length}
              </span>
              <Progress value={progress} className="w-32" />
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{currentAngle.label}</CardTitle>
                <CardDescription>{currentAngle.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera viewfinder */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
                        <p>Analyzing photo...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={capturePhoto} 
                    disabled={isAnalyzing}
                    className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" onClick={skipPhoto} disabled={isAnalyzing}>
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Damage alerts */}
            {damagesFound.length > 0 && (
              <Card className="border-yellow-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Damage Detected ({damagesFound.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {damagesFound.map((d, i) => (
                      <li key={i} className="text-muted-foreground">
                        {REQUIRED_ANGLES.find(a => a.id === d.angle)?.label}: {d.damageDescription}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Notes Step */}
        {step === 'notes' && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Add any notes about the vehicle condition, cleanliness, or concerns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., Small scratch on driver door, interior clean, half tank of gas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              
              {damagesFound.length > 0 && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {damagesFound.length} damage point(s) were automatically detected
                  </p>
                </div>
              )}
              
              <Button onClick={() => setStep('signature')} className="w-full">
                Continue to Signature
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Signature Step */}
        {step === 'signature' && (
          <Card>
            <CardHeader>
              <CardTitle>Sign to Confirm</CardTitle>
              <CardDescription>
                By signing, you confirm that this inspection accurately reflects the vehicle condition
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg bg-white p-2">
                <canvas
                  ref={signatureCanvasRef}
                  className="w-full h-32 touch-none cursor-crosshair"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const canvas = signatureCanvasRef.current
                    if (canvas) {
                      const ctx = canvas.getContext('2d')
                      ctx?.clearRect(0, 0, canvas.width, canvas.height)
                      setSignature(null)
                    }
                  }}
                >
                  Clear
                </Button>
                <Button 
                  onClick={completeInspection} 
                  disabled={!signature}
                  className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]"
                >
                  Complete Inspection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Complete Step */}
        {step === 'complete' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Inspection Complete!</h2>
              <p className="text-muted-foreground mb-6">
                {type === 'pre'
                  ? 'Your pre-rental inspection has been recorded. Enjoy your trip!'
                  : 'Your post-rental inspection has been recorded. Thank you for renting with us!'}
              </p>
              
              {damagesFound.length > 0 && type === 'post' && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-4 text-left">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    New damage was detected during this inspection
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Our team will review the inspection and contact you if needed.
                  </p>
                </div>
              )}
              
              <Button asChild className="w-full">
                <a href={`/bookings/${bookingId}`}>View Booking Details</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
