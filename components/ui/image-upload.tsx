'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  placeholder?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto'
  maxSizeMB?: number
  accept?: string
  disabled?: boolean
  showCamera?: boolean
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  placeholder = 'Click to upload or drag and drop',
  className,
  aspectRatio = 'square',
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png,image/webp',
  disabled = false,
  showCamera = true,
  label,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: '',
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max: ${maxSizeMB}MB`)
      return
    }

    // Validate type
    const acceptedTypes = accept.split(',').map(t => t.trim())
    if (!acceptedTypes.includes(file.type)) {
      setError('Invalid file type')
      return
    }

    setIsUploading(true)
    try {
      const result = await onUpload(file)
      if (result.success && result.url) {
        onChange(result.url)
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [accept, maxSizeMB, onChange, onUpload])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input
    e.target.value = ''
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors overflow-hidden',
          aspectClasses[aspectRatio],
          dragActive ? 'border-[#CC0000] bg-[#CC0000]/5' : 'border-muted-foreground/25',
          !value && !isUploading && 'hover:border-[#CC0000]/50 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !value && !isUploading && inputRef.current?.click()}
      >
        {/* Hidden inputs */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Preview */}
        {value && !isUploading && (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute bottom-2 right-2">
              <CheckCircle className="h-5 w-5 text-green-500 drop-shadow-md" />
            </div>
          </>
        )}

        {/* Loading state */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </div>
        )}

        {/* Empty state */}
        {!value && !isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Max {maxSizeMB}MB
            </p>
            
            {showCamera && (
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Browse
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    cameraRef.current?.click()
                  }}
                  disabled={disabled}
                  className="md:hidden"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Camera
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
