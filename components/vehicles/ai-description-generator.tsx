'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Loader2, Copy, Check, RefreshCw, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIDescriptionGeneratorProps {
  vehicleId: string
  currentDescription?: string
  photoUrls?: string[]
  onDescriptionChange: (description: string) => void
  className?: string
}

export function AIDescriptionGenerator({
  vehicleId,
  currentDescription = '',
  photoUrls = [],
  onDescriptionChange,
  className,
}: AIDescriptionGeneratorProps) {
  const [description, setDescription] = useState(currentDescription)
  const [isGenerating, setIsGenerating] = useState(false)
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showGenerated, setShowGenerated] = useState(false)

  // Check remaining generations on mount
  useEffect(() => {
    const checkRemaining = async () => {
      try {
        const res = await fetch(`/api/vehicles/generate-description?vehicleId=${vehicleId}`)
        if (res.ok) {
          const data = await res.json()
          setRemainingGenerations(data.remainingGenerations)
        }
      } catch (err) {
        console.error('Failed to check remaining generations:', err)
      }
    }
    
    if (vehicleId) {
      checkRemaining()
    }
  }, [vehicleId])

  // Sync external description changes
  useEffect(() => {
    if (currentDescription && currentDescription !== description) {
      setDescription(currentDescription)
    }
  }, [currentDescription])

  const handleGenerate = async () => {
    if (!vehicleId) return
    
    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/vehicles/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, photoUrls }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate description')
        return
      }

      setDescription(data.description)
      setRemainingGenerations(data.remainingGenerations)
      setShowGenerated(true)
      onDescriptionChange(data.description)

    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onDescriptionChange(value)
  }

  const canGenerate = remainingGenerations === null || remainingGenerations > 0

  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#e50914] to-[#ff6b6b]">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg text-white">Vehicle Description</CardTitle>
          </div>
          {remainingGenerations !== null && (
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                remainingGenerations > 0 
                  ? 'border-emerald-500/50 text-emerald-400' 
                  : 'border-amber-500/50 text-amber-400'
              )}
            >
              {remainingGenerations} AI generations left today
            </Badge>
          )}
        </div>
        <CardDescription className="text-zinc-400">
          Write a compelling description or let RAD AI generate one based on your vehicle details.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Describe your vehicle... What makes it special? Perfect for road trips? Great gas mileage? Spacious interior?"
            className={cn(
              'min-h-[180px] bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 resize-none',
              showGenerated && 'ring-2 ring-emerald-500/50'
            )}
          />
          {description && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2 h-8 w-8 p-0 text-zinc-400 hover:text-white"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Character count */}
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{description.length} characters</span>
          <span>Recommended: 150-300 characters</span>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {showGenerated && !error && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Description generated! Feel free to edit it to your liking.
          </div>
        )}

        {/* Generate button */}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className={cn(
            'w-full h-12 text-base font-medium transition-all',
            canGenerate
              ? 'bg-gradient-to-r from-[#e50914] to-[#ff4757] hover:from-[#c00810] hover:to-[#e50914] text-white shadow-lg shadow-red-500/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              RAD AI is writing...
            </>
          ) : description ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2" />
              Regenerate with RAD AI
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate with RAD AI
            </>
          )}
        </Button>

        {/* Info text */}
        <p className="text-xs text-zinc-500 text-center">
          RAD AI uses your vehicle details, photos, and Inspektlabs data to craft the perfect listing description.
        </p>
      </CardContent>
    </Card>
  )
}
