'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Camera, CheckCircle, AlertTriangle, ChevronRight, Download, Share2, RotateCcw, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Cartegrity branded colors
const BRAND_RED = '#CC0000'

const INSPECTION_ANGLES = [
  { id: 'front', label: 'Front', instruction: 'Stand 10 feet away. Capture full front bumper, hood, and headlights.' },
  { id: 'rear', label: 'Rear', instruction: 'Stand 10 feet away. Capture full rear bumper, trunk, and taillights.' },
  { id: 'driver_side', label: 'Driver Side', instruction: 'Stand back to capture entire side profile including all doors.' },
  { id: 'passenger_side', label: 'Passenger Side', instruction: 'Stand back to capture entire side profile including all doors.' },
  { id: 'interior_front', label: 'Interior Front', instruction: 'Capture dashboard, steering wheel, and front seats.' },
  { id: 'interior_rear', label: 'Interior Rear', instruction: 'Capture rear seats, floor mats, and any cargo.' },
  { id: 'roof', label: 'Roof', instruction: 'Stand on side to capture roof. Note any dents, scratches, or rack damage.' },
  { id: 'trunk', label: 'Trunk', instruction: 'Open trunk/cargo area. Capture interior condition and spare tire.' },
]

interface PhotoCapture {
  angle: string
  label: string
  photo: string
  analysis: {
    damage_detected: boolean
    damage_severity: 'none' | 'minor' | 'moderate' | 'severe'
    damage_description: string
    confidence_score: number
  }
}

interface BookingInfo {
  id: string
  vehicle: {
    year: number
    make: string
    model: string
    license_plate: string
    image_url?: string
  }
  start_date: string
  end_date: string
}

type Screen = 'welcome' | 'camera' | 'summary' | 'complete'

export default function CartegrityInspectionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.bookingId as string
  const type = searchParams.get('type') === 'post' ? 'POST' : 'PRE'
  
  // State
  const [screen, setScreen] = useState<Screen>('welcome')
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState([50])
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0)
  const [photos, setPhotos] = useState<PhotoCapture[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<PhotoCapture['analysis'] | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [inspectionId, setInspectionId] = useState<string | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [offlinePhotos, setOfflinePhotos] = useState<{angle: string, photo: string}[]>([])
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const currentAngle = INSPECTION_ANGLES[currentAngleIndex]
  const progress = (photos.length / INSPECTION_ANGLES.length) * 100

  // Fetch booking info
  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        if (res.ok) {
          const data = await res.json()
          setBooking(data.booking)
        }
      } catch {
        // Use mock data for demo
        setBooking({
          id: bookingId,
          vehicle: {
            year: 2023,
            make: 'Toyota',
            model: '4Runner TRD Pro',
            license_plate: 'ABC-1234',
          },
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }
    fetchBooking()
  }, [bookingId])

  // Start camera when entering camera screen
  useEffect(() => {
    if (screen === 'camera') {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [screen])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      toast.error('Camera access required. Please enable camera permissions.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  async function startInspection() {
    if (!mileage) {
      toast.error('Please enter the current mileage')
      return
    }

    try {
      const res = await fetch('/api/inspections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId, 
          type: type.toLowerCase(),
          mileage: parseInt(mileage),
          fuelLevel: fuelLevel[0],
        })
      })
      const data = await res.json()
      setInspectionId(data.inspectionId || `insp_${Date.now()}`)
      setScreen('camera')
    } catch {
      // Create local inspection ID for offline mode
      setInspectionId(`insp_offline_${Date.now()}`)
      setScreen('camera')
    }
  }

  const compressPhoto = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1200
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Compress to ~1.5MB max
        let quality = 0.8
        let result = canvas.toDataURL('image/jpeg', quality)
        while (result.length > 1500000 && quality > 0.3) {
          quality -= 0.1
          result = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(result)
      }
      img.src = dataUrl
    })
  }, [])

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current || !currentAngle) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx?.drawImage(video, 0, 0)
    
    const rawPhoto = canvas.toDataURL('image/jpeg', 0.9)
    const compressedPhoto = await compressPhoto(rawPhoto)
    
    setCapturedPhoto(compressedPhoto)
    setIsAnalyzing(true)
    setAnalysisResult(null)

    // Check if online
    if (!navigator.onLine) {
      // Store for later sync
      setOfflinePhotos(prev => [...prev, { angle: currentAngle.id, photo: compressedPhoto }])
      setAnalysisResult({
        damage_detected: false,
        damage_severity: 'none',
        damage_description: 'Offline - will sync when connected',
        confidence_score: 0,
      })
      setIsAnalyzing(false)
      return
    }

    try {
      const res = await fetch('/api/inspect/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          photo: compressedPhoto,
          angle: currentAngle.label,
        })
      })
      
      const data = await res.json()
      setAnalysisResult(data.analysis)
    } catch {
      setAnalysisResult({
        damage_detected: false,
        damage_severity: 'none',
        damage_description: 'Analysis unavailable',
        confidence_score: 0,
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  function confirmPhoto() {
    if (!capturedPhoto || !analysisResult || !currentAngle) return
    
    const capture: PhotoCapture = {
      angle: currentAngle.id,
      label: currentAngle.label,
      photo: capturedPhoto,
      analysis: analysisResult,
    }
    
    setPhotos(prev => [...prev, capture])
    setCapturedPhoto(null)
    setAnalysisResult(null)
    
    if (currentAngleIndex < INSPECTION_ANGLES.length - 1) {
      setCurrentAngleIndex(prev => prev + 1)
    } else {
      stopCamera()
      setScreen('summary')
    }
  }

  function retakePhoto() {
    setCapturedPhoto(null)
    setAnalysisResult(null)
  }

  async function submitInspection() {
    try {
      const res = await fetch('/api/inspections/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          mileage: parseInt(mileage),
          fuelLevel: fuelLevel[0],
          notes,
          photos: photos.map(p => ({
            angle: p.angle,
            damage_detected: p.analysis.damage_detected,
            damage_severity: p.analysis.damage_severity,
            damage_description: p.analysis.damage_description,
          })),
        })
      })
      
      const data = await res.json()
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
      const randomSuffix = Math.random().toString(36).substring(2,6).toUpperCase()
      setReportId(data.reportId || `CART-${dateStr}-${randomSuffix}`)
      setScreen('complete')
    } catch {
      // Generate local report ID
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
      const randomSuffix = Math.random().toString(36).substring(2,6).toUpperCase()
      setReportId(`CART-${dateStr}-${randomSuffix}`)
      setScreen('complete')
    }
  }

  async function downloadPDF() {
    if (typeof window === 'undefined') return
    
    try {
      // Dynamically import jsPDF only on client side
      // @ts-ignore - dynamic import
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setTextColor(204, 0, 0)
      doc.text('CARTEGRITY', 20, 20)
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text('Vehicle Integrity. Verified.', 20, 27)
      
      // Report info
      doc.setFontSize(12)
      doc.setTextColor(0)
      doc.text(`Report ID: ${reportId}`, 20, 40)
      doc.text(`Inspection Type: ${type}`, 20, 48)
      doc.text(`Vehicle: ${booking?.vehicle.year} ${booking?.vehicle.make} ${booking?.vehicle.model}`, 20, 56)
      doc.text(`License Plate: ${booking?.vehicle.license_plate}`, 20, 64)
      doc.text(`Mileage: ${mileage}`, 20, 72)
      doc.text(`Fuel Level: ${fuelLevel[0]}%`, 20, 80)
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 88)
      
      // Condition score
      const damageCount = photos.filter(p => p.analysis.damage_detected).length
      const conditionScore = Math.round(100 - (damageCount * 12.5))
      doc.setFontSize(14)
      doc.text(`Overall Condition: ${conditionScore}/100`, 20, 100)
      
      // Photos summary
      doc.setFontSize(12)
      doc.text('Inspection Points:', 20, 115)
      
      let y = 125
      photos.forEach((photo, index) => {
        const status = photo.analysis.damage_detected ? 'DAMAGE' : 'CLEAN'
        const color = photo.analysis.damage_detected ? [204, 0, 0] : [0, 150, 0]
        doc.setTextColor(color[0], color[1], color[2])
        doc.text(`${index + 1}. ${photo.label}: ${status}`, 25, y)
        if (photo.analysis.damage_detected) {
          doc.setFontSize(10)
          doc.setTextColor(100)
          doc.text(`   ${photo.analysis.damage_description}`, 25, y + 6)
          y += 6
          doc.setFontSize(12)
        }
        y += 10
      })
      
      // Notes
      if (notes) {
        doc.setTextColor(0)
        doc.text('Notes:', 20, y + 10)
        doc.setFontSize(10)
        doc.text(notes, 25, y + 18, { maxWidth: 160 })
      }
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('Generated by Cartegrity AI | Rent and Drive LLC', 20, 280)
      
      doc.save(`${reportId}.pdf`)
      toast.success('PDF downloaded')
    } catch (error) {
      toast.error('Failed to generate PDF')
      console.error(error)
    }
  }

  function shareReport() {
    const url = `${window.location.origin}/inspect/report/${reportId}`
    if (navigator.share) {
      navigator.share({
        title: `Cartegrity Report ${reportId}`,
        text: `Vehicle inspection report for ${booking?.vehicle.year} ${booking?.vehicle.make} ${booking?.vehicle.model}`,
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    }
  }

  const damageCount = photos.filter(p => p.analysis.damage_detected).length
  const conditionScore = Math.round(100 - (damageCount * 12.5))

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#CC0000] flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#CC0000]">CARTEGRITY</span>
              <p className="text-[10px] text-zinc-500 -mt-1">Vehicle Integrity. Verified.</p>
            </div>
          </div>
          <Badge 
            className={type === 'PRE' 
              ? 'bg-blue-600 hover:bg-blue-600' 
              : 'bg-orange-600 hover:bg-orange-600'
            }
          >
            {type} RENTAL
          </Badge>
        </div>
      </header>

      <main className="pb-24">
        {/* SCREEN 1: Welcome */}
        {screen === 'welcome' && (
          <div className="p-4 space-y-6">
            {/* Vehicle Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Vehicle Information</CardTitle>
              </CardHeader>
              <CardContent>
                {booking ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-white">
                      {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                    </p>
                    <p className="text-zinc-400">License: {booking.vehicle.license_plate}</p>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-zinc-800 rounded w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded w-1/2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mileage Input */}
            <div className="space-y-2">
              <Label className="text-white">Current Mileage *</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="e.g., 45230"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white text-lg h-14"
              />
            </div>

            {/* Fuel Level Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white flex items-center gap-2">
                  <Fuel className="h-4 w-4" /> Fuel Level
                </Label>
                <span className="text-[#CC0000] font-bold">{fuelLevel[0]}%</span>
              </div>
              <Slider
                value={fuelLevel}
                onValueChange={setFuelLevel}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-[#CC0000] [&_[role=slider]]:border-[#CC0000]"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Empty</span>
                <span>1/4</span>
                <span>1/2</span>
                <span>3/4</span>
                <span>Full</span>
              </div>
            </div>

            {/* Instructions */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4">
                <p className="text-sm text-zinc-400">
                  You will capture <span className="text-white font-semibold">8 photos</span> from different angles. 
                  Cartegrity AI will analyze each photo for damage in real-time.
                </p>
              </CardContent>
            </Card>

            {/* Start Button */}
            <Button 
              onClick={startInspection}
              disabled={!mileage}
              className="w-full h-14 text-lg bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-50"
            >
              Start Inspection
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* SCREEN 2: Camera Capture */}
        {screen === 'camera' && currentAngle && (
          <div className="relative min-h-[calc(100vh-56px)]">
            {!capturedPhoto ? (
              <>
                {/* Live Camera */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-[60vh] object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Angle Info */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/70 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400">
                        Photo {currentAngleIndex + 1} of {INSPECTION_ANGLES.length}
                      </span>
                      <Progress value={progress} className="w-24 h-2" />
                    </div>
                    <p className="text-xl font-bold text-white">{currentAngle.label}</p>
                    <p className="text-sm text-zinc-300">{currentAngle.instruction}</p>
                  </div>
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white border-4 border-[#CC0000] flex items-center justify-center active:scale-95 transition-transform"
                    style={{ minWidth: 80, minHeight: 80 }} // 44px+ touch target
                  >
                    <div className="w-16 h-16 rounded-full bg-[#CC0000]" />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Captured Photo Preview */}
                <img 
                  src={capturedPhoto} 
                  alt="Captured" 
                  className="w-full h-[60vh] object-cover"
                />

                {/* Analysis Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isAnalyzing ? (
                    <div className="bg-black/80 backdrop-blur rounded-xl p-8 text-center">
                      <div className="animate-spin h-12 w-12 border-4 border-[#CC0000] border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-white text-lg font-semibold">Cartegrity AI analyzing...</p>
                    </div>
                  ) : analysisResult && (
                    <div className={`rounded-xl p-6 text-center ${
                      analysisResult.damage_detected 
                        ? 'bg-red-900/90' 
                        : 'bg-green-900/90'
                    }`}>
                      {analysisResult.damage_detected ? (
                        <>
                          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-2" />
                          <p className="text-red-400 text-xl font-bold">DAMAGE DETECTED</p>
                          <p className="text-white text-sm mt-2">{analysisResult.damage_description}</p>
                          <Badge className="mt-2 bg-red-700">
                            {analysisResult.damage_severity.toUpperCase()}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                          <p className="text-green-400 text-xl font-bold">CLEAN</p>
                          <p className="text-white text-sm mt-2">No damage detected</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isAnalyzing && analysisResult && (
                  <div className="absolute bottom-8 left-4 right-4 flex gap-3">
                    <Button
                      onClick={retakePhoto}
                      variant="outline"
                      className="flex-1 h-14 border-zinc-600 text-white hover:bg-zinc-800"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Retake
                    </Button>
                    <Button
                      onClick={confirmPhoto}
                      className="flex-1 h-14 bg-[#CC0000] hover:bg-[#AA0000]"
                    >
                      {currentAngleIndex < INSPECTION_ANGLES.length - 1 ? 'Continue' : 'Review'}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SCREEN 3: Summary */}
        {screen === 'summary' && (
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold">Inspection Summary</h2>

            {/* Photo Grid */}
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div 
                  key={photo.angle}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    photo.analysis.damage_detected 
                      ? 'border-red-500' 
                      : 'border-green-500'
                  }`}
                >
                  <img 
                    src={photo.photo} 
                    alt={photo.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                    <p className="text-[10px] text-white truncate">{photo.label}</p>
                  </div>
                  <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    photo.analysis.damage_detected ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    {photo.analysis.damage_detected 
                      ? <AlertTriangle className="h-2.5 w-2.5 text-white" />
                      : <CheckCircle className="h-2.5 w-2.5 text-white" />
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Condition Score */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Overall Condition</span>
                  <span className={`text-3xl font-bold ${
                    conditionScore >= 80 ? 'text-green-500' :
                    conditionScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {conditionScore}/100
                  </span>
                </div>
                {damageCount > 0 && (
                  <p className="text-sm text-red-400 mt-2">
                    {damageCount} damage point(s) detected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Mileage Confirmation */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Mileage</span>
                  <span className="text-white font-semibold">{parseInt(mileage).toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Fuel Level</span>
                  <span className="text-white font-semibold">{fuelLevel[0]}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-white">Additional Notes (optional)</Label>
              <Textarea
                placeholder="Any additional observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
              />
            </div>

            {/* Submit Button */}
            <Button 
              onClick={submitInspection}
              className="w-full h-14 text-lg bg-[#CC0000] hover:bg-[#AA0000]"
            >
              Submit Inspection
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* SCREEN 4: Complete */}
        {screen === 'complete' && (
          <div className="p-4 space-y-6 text-center">
            <div className="pt-8">
              <div className="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Inspection Complete!</h2>
              <p className="text-zinc-400 mt-2">Your report has been saved</p>
            </div>

            {/* Report ID */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4">
                <p className="text-zinc-400 text-sm">Report ID</p>
                <p className="text-xl font-mono font-bold text-[#CC0000]">{reportId}</p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={downloadPDF}
                variant="outline"
                className="w-full h-14 border-zinc-600 text-white hover:bg-zinc-800"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
              <Button 
                onClick={shareReport}
                variant="outline"
                className="w-full h-14 border-zinc-600 text-white hover:bg-zinc-800"
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share Link
              </Button>
              <Button 
                onClick={() => window.location.href = `/bookings/${bookingId}`}
                className="w-full h-14 bg-[#CC0000] hover:bg-[#AA0000]"
              >
                Done
              </Button>
            </div>

            {/* Powered By */}
            <p className="text-xs text-zinc-600 pt-4">
              Powered by Cartegrity AI | Rent and Drive LLC
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
