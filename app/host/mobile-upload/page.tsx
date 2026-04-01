'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Camera, Upload, CheckCircle2, FileText, Shield, ArrowRight, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'

type DocType = 'dl_front' | 'dl_back' | 'insurance'

interface UploadedDoc {
  type: DocType
  file: File
  preview: string
  uploaded: boolean
}

const DOC_CONFIG: Record<DocType, { label: string; description: string; icon: typeof FileText }> = {
  dl_front: {
    label: "Driver's License (Front)",
    description: 'Clear photo of the front of your license',
    icon: FileText,
  },
  dl_back: {
    label: "Driver's License (Back)",
    description: 'Clear photo of the back of your license',
    icon: FileText,
  },
  insurance: {
    label: 'Proof of Insurance',
    description: 'Insurance card or policy document',
    icon: Shield,
  },
}

function MobileUploadContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  
  const [currentStep, setCurrentStep] = useState<DocType>('dl_front')
  const [uploads, setUploads] = useState<Record<DocType, UploadedDoc | null>>({
    dl_front: null,
    dl_back: null,
    insurance: null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const steps: DocType[] = ['dl_front', 'dl_back', 'insurance']
  const completedCount = Object.values(uploads).filter(u => u?.uploaded).length
  const progress = (completedCount / steps.length) * 100

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const preview = URL.createObjectURL(file)
    
    setUploads(prev => ({
      ...prev,
      [currentStep]: {
        type: currentStep,
        file,
        preview,
        uploaded: false,
      },
    }))
  }

  // Upload current document
  const uploadDocument = async () => {
    const doc = uploads[currentStep]
    if (!doc) return

    setIsUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Store locally for sync later
        localStorage.setItem(`rad-mobile-upload-${sessionId}-${currentStep}`, JSON.stringify({
          name: doc.file.name,
          type: doc.file.type,
          preview: doc.preview,
          timestamp: Date.now(),
        }))
      } else {
        // Upload to storage
        const fileName = `${user.id}/${currentStep}/${Date.now()}-${doc.file.name}`
        await supabase.storage.from('filing-cabinet').upload(fileName, doc.file)
        
        // Store metadata
        await supabase.from('documents').insert({
          user_id: user.id,
          document_type: currentStep === 'dl_front' || currentStep === 'dl_back' ? 'license' : 'insurance',
          file_name: doc.file.name,
          file_path: fileName,
          file_size: doc.file.size,
          mime_type: doc.file.type,
        })
      }

      // Mark as uploaded
      setUploads(prev => ({
        ...prev,
        [currentStep]: { ...prev[currentStep]!, uploaded: true },
      }))

      // Move to next step or complete
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1])
      } else {
        setCompleted(true)
        syncToDesktop()
      }
    } catch (err) {
      console.error('[v0] Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Sync status to desktop session
  const syncToDesktop = async () => {
    setSyncing(true)
    try {
      // Store completion status in localStorage for cross-tab sync
      localStorage.setItem(`rad-mobile-session-complete-${sessionId}`, JSON.stringify({
        completed: true,
        documents: Object.entries(uploads).map(([type, doc]) => ({
          type,
          name: doc?.file.name,
          uploaded: doc?.uploaded,
        })),
        timestamp: Date.now(),
      }))
      
      // Broadcast to other tabs
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('rad-mobile-upload')
        channel.postMessage({
          type: 'upload-complete',
          sessionId,
          documents: Object.keys(uploads),
        })
        channel.close()
      }
    } catch (err) {
      console.error('[v0] Sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      Object.values(uploads).forEach(doc => {
        if (doc?.preview) URL.revokeObjectURL(doc.preview)
      })
    }
  }, [uploads])

  const config = DOC_CONFIG[currentStep]
  const currentDoc = uploads[currentStep]

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">All Documents Uploaded!</h1>
        <p className="text-muted-foreground mb-6">
          {syncing ? 'Syncing to your desktop session...' : 'You can now return to your computer to continue.'}
        </p>
        {syncing && <Loader2 className="w-6 h-6 animate-spin text-[#CC0000]" />}
        <div className="space-y-2 mt-6">
          {steps.map(step => (
            <div key={step} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>{DOC_CONFIG[step].label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          You can close this page now.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-[#CC0000] text-white p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Smartphone className="w-5 h-5" />
          <span className="font-semibold">RAD Mobile Upload</span>
        </div>
        <p className="text-white/80 text-xs">Upload documents for your vehicle listing</p>
      </div>

      {/* Progress */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedCount} of {steps.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {steps.map((step, i) => (
            <div 
              key={step} 
              className={`text-xs ${uploads[step]?.uploaded ? 'text-green-600' : step === currentStep ? 'text-[#CC0000] font-medium' : 'text-muted-foreground'}`}
            >
              {i + 1}. {step === 'dl_front' ? 'DL Front' : step === 'dl_back' ? 'DL Back' : 'Insurance'}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="text-center mb-6">
          <Badge className="bg-[#CC0000]/20 text-[#CC0000] border-[#CC0000]/30 mb-3">
            Step {steps.indexOf(currentStep) + 1} of {steps.length}
          </Badge>
          <h2 className="text-xl font-bold text-foreground mb-1">{config.label}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Preview or Upload Zone */}
        <Card className="flex-1 mb-6">
          <CardContent className="p-0 h-full">
            {currentDoc ? (
              <div className="relative h-full min-h-[300px]">
                {currentDoc.file.type.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={currentDoc.preview} 
                    alt={config.label}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileText className="w-16 h-16 mb-3" />
                    <p className="font-medium">{currentDoc.file.name}</p>
                    <p className="text-sm">{(currentDoc.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}
                {currentDoc.uploaded && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Uploaded
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-20 h-20 bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-[#CC0000]" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">Tap to Take Photo</p>
                <p className="text-sm text-muted-foreground">or choose from gallery</p>
              </label>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentDoc && !currentDoc.uploaded && (
            <Button 
              size="lg" 
              className="w-full h-14 bg-[#CC0000] hover:bg-[#CC0000]/90 text-lg"
              onClick={uploadDocument}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}
          
          {currentDoc && (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-12"
                asChild
              >
                <span>
                  <Camera className="w-5 h-5 mr-2" />
                  Retake Photo
                </span>
              </Button>
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading fallback
function MobileUploadLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#CC0000] animate-spin" />
        <p className="text-muted-foreground">Loading upload session...</p>
      </div>
    </div>
  )
}

export default function MobileUploadPage() {
  return (
    <Suspense fallback={<MobileUploadLoading />}>
      <MobileUploadContent />
    </Suspense>
  )
}
