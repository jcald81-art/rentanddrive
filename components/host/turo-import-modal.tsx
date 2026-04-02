'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Link2, Sparkles, Car, Zap, MapPin, DollarSign, Shield, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TuroImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: (vehicleId: string) => void
}

type ImportStep = 'url' | 'preview' | 'customize' | 'confirm' | 'complete'

interface ParsedData {
  make: string | null
  model: string | null
  year: number | null
  location: {
    city?: string
    state?: string
  }
}

interface AIEnhancements {
  suggestedRate: number | null
  enhancedDescription: string | null
  detectedEV: boolean
  detectedMake: string | null
  detectedModel: string | null
}

export function TuroImportModal({ open, onOpenChange, onImportComplete }: TuroImportModalProps) {
  const [step, setStep] = useState<ImportStep>('url')
  const [turoUrl, setTuroUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Import data
  const [importId, setImportId] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [aiEnhancements, setAiEnhancements] = useState<AIEnhancements | null>(null)
  
  // Editable fields
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  
  // Options
  const [enableDelivery, setEnableDelivery] = useState(false)
  const [enableSmartcar, setEnableSmartcar] = useState(false)
  const [enableBlockchain, setEnableBlockchain] = useState(false)
  
  // Created vehicle
  const [vehicleId, setVehicleId] = useState<string | null>(null)

  const resetModal = () => {
    setStep('url')
    setTuroUrl('')
    setIsLoading(false)
    setError(null)
    setImportId(null)
    setParsedData(null)
    setAiEnhancements(null)
    setMake('')
    setModel('')
    setYear('')
    setDescription('')
    setDailyRate('')
    setCity('')
    setState('')
    setEnableDelivery(false)
    setEnableSmartcar(false)
    setEnableBlockchain(false)
    setVehicleId(null)
  }

  const handleClose = () => {
    resetModal()
    onOpenChange(false)
  }

  const handleStartImport = async () => {
    if (!turoUrl.trim()) {
      setError('Please enter a Turo listing URL')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/integrations/turo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', turoUrl }),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import listing')
      }
      
      setImportId(result.importId)
      setParsedData(result.data)
      setAiEnhancements(result.aiEnhancements)
      
      // Pre-fill form fields
      setMake(result.aiEnhancements?.detectedMake || result.data?.make || '')
      setModel(result.aiEnhancements?.detectedModel || result.data?.model || '')
      setYear(result.data?.year?.toString() || '')
      setDescription(result.aiEnhancements?.enhancedDescription || result.data?.description || '')
      setDailyRate(result.aiEnhancements?.suggestedRate ? (result.aiEnhancements.suggestedRate / 100).toString() : '')
      setCity(result.data?.location?.city || '')
      setState(result.data?.location?.state || '')
      setEnableDelivery(result.aiEnhancements?.detectedEV || false)
      setEnableSmartcar(result.aiEnhancements?.detectedEV || false)
      
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import listing')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteImport = async () => {
    if (!importId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/integrations/turo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          importId,
          vehicleData: {
            make,
            model,
            year: parseInt(year),
            description,
            dailyRate: Math.round(parseFloat(dailyRate) * 100), // Convert to cents
            photos: [],
            features: [],
            location: { city, state },
            enableDelivery,
            enableSmartcar,
            enableBlockchain,
          },
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to complete import')
      }
      
      setVehicleId(result.vehicleId)
      setStep('complete')
      
      if (onImportComplete && result.vehicleId) {
        onImportComplete(result.vehicleId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete import')
    } finally {
      setIsLoading(false)
    }
  }

  const renderUrlStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
        <Link2 className="w-8 h-8 text-primary" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Import from Turo</h3>
        <p className="text-sm text-muted-foreground">
          Paste your Turo listing URL and we&apos;ll automatically import your vehicle details.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="turo-url">Turo Listing URL</Label>
        <Input
          id="turo-url"
          placeholder="https://turo.com/us/en/car-rental/.../your-vehicle/123456"
          value={turoUrl}
          onChange={(e) => setTuroUrl(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Example: turo.com/us/en/car-rental/united-states/los-angeles-ca/tesla/model-3/1234567
        </p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        onClick={handleStartImport} 
        disabled={isLoading || !turoUrl.trim()}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Listing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Import with AI
          </>
        )}
      </Button>
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold">Listing Detected</h3>
          <p className="text-sm text-muted-foreground">
            We found your vehicle. Review and customize below.
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">
                {year} {make} {model}
              </span>
            </div>
            {aiEnhancements?.detectedEV && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                <Zap className="w-3 h-3 mr-1" />
                Electric
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{city}{state ? `, ${state}` : ''}</span>
          </div>
          
          {dailyRate && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="font-medium text-primary">${dailyRate}/day</span>
              <span className="text-xs text-muted-foreground">(AI suggested)</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Vehicle Details</h4>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="make" className="text-xs">Make</Label>
            <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model" className="text-xs">Model</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-xs">Year</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} type="number" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-xs">State</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="daily-rate" className="text-xs">Daily Rate ($)</Label>
          <Input 
            id="daily-rate" 
            value={dailyRate} 
            onChange={(e) => setDailyRate(e.target.value)} 
            type="number"
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('url')} className="flex-1">
          Back
        </Button>
        <Button onClick={() => setStep('customize')} className="flex-1 bg-primary hover:bg-primary/90">
          Continue
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )

  const renderCustomizeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Enable Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Supercharge your listing with RAD platform features.
        </p>
      </div>
      
      <div className="space-y-4">
        <Card className={cn(
          "cursor-pointer transition-all",
          enableDelivery && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                  <Car className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Uber/Lyft Delivery</h4>
                  <p className="text-xs text-muted-foreground">
                    Hands-free vehicle delivery via rideshare
                  </p>
                </div>
              </div>
              <Switch 
                checked={enableDelivery} 
                onCheckedChange={setEnableDelivery}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "cursor-pointer transition-all",
          enableSmartcar && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium">Smartcar Connect</h4>
                  <p className="text-xs text-muted-foreground">
                    Remote lock/unlock, battery, location tracking
                  </p>
                </div>
              </div>
              <Switch 
                checked={enableSmartcar} 
                onCheckedChange={setEnableSmartcar}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "cursor-pointer transition-all",
          enableBlockchain && "ring-2 ring-primary"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10">
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium">Blockchain NFT Twin</h4>
                  <p className="text-xs text-muted-foreground">
                    Immutable rental history and provenance
                  </p>
                </div>
              </div>
              <Switch 
                checked={enableBlockchain} 
                onCheckedChange={setEnableBlockchain}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('preview')} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleCompleteImport} 
          disabled={isLoading || !make || !model || !year}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Listing
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-green-500/10">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Import Complete!</h3>
        <p className="text-muted-foreground">
          Your {year} {make} {model} has been imported successfully.
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => window.location.href = `/host/vehicles/${vehicleId}/settings`}
          className="w-full bg-primary hover:bg-primary/90"
        >
          View & Publish Listing
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button variant="outline" onClick={handleClose} className="w-full">
          Import Another
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Import from Turo</DialogTitle>
          <DialogDescription className="sr-only">
            Import your Turo listing to the RAD platform
          </DialogDescription>
        </DialogHeader>
        
        {step === 'url' && renderUrlStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'customize' && renderCustomizeStep()}
        {step === 'complete' && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  )
}
