'use client'

import { useState, useCallback } from 'react'
import { Search, CheckCircle, AlertCircle, Loader2, Car, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RecallBadge } from './recall-badge'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface DecodedVehicle {
  vin: string
  is_valid: boolean
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  body_class: string | null
  doors: number | null
  engine_cylinders: number | null
  engine_displacement_l: number | null
  fuel_type: string | null
  drive_type: string | null
  transmission: string | null
  manufacturer: string | null
  plant_country: string | null
  vehicle_type: string | null
  suggested_category: string
  is_awd: boolean
}

interface RecallSummary {
  total_recalls: number
  summary: {
    critical: number
    warning: number
    info: number
  }
}

interface VinDecoderProps {
  onDecoded?: (data: DecodedVehicle) => void
  onRecallsChecked?: (data: RecallSummary) => void
  className?: string
}

export function VinDecoder({ onDecoded, onRecallsChecked, className }: VinDecoderProps) {
  const [vin, setVin] = useState('')
  const [isDecoding, setIsDecoding] = useState(false)
  const [isCheckingRecalls, setIsCheckingRecalls] = useState(false)
  const [decodedData, setDecodedData] = useState<DecodedVehicle | null>(null)
  const [recallData, setRecallData] = useState<RecallSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decodeVin = useCallback(async (vinValue: string) => {
    if (vinValue.length !== 17) {
      setError('VIN must be exactly 17 characters')
      return
    }

    setIsDecoding(true)
    setError(null)
    setDecodedData(null)
    setRecallData(null)

    try {
      // Decode VIN
      const decodeRes = await fetch(`/api/nhtsa/decode/${vinValue}`)
      if (!decodeRes.ok) {
        throw new Error('Failed to decode VIN')
      }
      const decoded = await decodeRes.json()
      
      if (!decoded.make || !decoded.model || !decoded.year) {
        setError('Could not decode this VIN. Please verify it is correct.')
        return
      }

      setDecodedData(decoded)
      onDecoded?.(decoded)

      // Check recalls simultaneously
      setIsCheckingRecalls(true)
      const recallRes = await fetch(`/api/nhtsa/recalls/${vinValue}`)
      if (recallRes.ok) {
        const recalls = await recallRes.json()
        setRecallData(recalls)
        onRecallsChecked?.(recalls)
      }
    } catch (err) {
      setError('Failed to decode VIN. Please try again.')
      console.error('[VinDecoder] Error:', err)
    } finally {
      setIsDecoding(false)
      setIsCheckingRecalls(false)
    }
  }, [onDecoded, onRecallsChecked])

  const handleVinChange = (value: string) => {
    // Only allow alphanumeric, uppercase
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17)
    setVin(cleaned)
    setError(null)
    
    // Clear previous results if VIN changed significantly
    if (cleaned.length < 17) {
      setDecodedData(null)
      setRecallData(null)
    }
  }

  const highestSeverity = recallData 
    ? (recallData.summary.critical > 0 ? 'CRITICAL' 
      : recallData.summary.warning > 0 ? 'WARNING' 
      : recallData.summary.info > 0 ? 'INFO' 
      : null)
    : null

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => handleVinChange(e.target.value)}
            className="pr-12 font-mono tracking-wider uppercase"
            maxLength={17}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {vin.length}/17
          </span>
        </div>
        <Button 
          onClick={() => decodeVin(vin)}
          disabled={vin.length !== 17 || isDecoding}
        >
          {isDecoding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Decode
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {decodedData && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                VIN Verified
              </CardTitle>
              {isCheckingRecalls ? (
                <Badge variant="secondary" className="animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Checking recalls...
                </Badge>
              ) : recallData && (
                <RecallBadge 
                  severity={highestSeverity} 
                  recallCount={recallData.total_recalls}
                  size="sm"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Make</p>
                <p className="font-medium">{decodedData.make}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium">{decodedData.model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Year</p>
                <p className="font-medium">{decodedData.year}</p>
              </div>
              {decodedData.trim && (
                <div>
                  <p className="text-xs text-muted-foreground">Trim</p>
                  <p className="font-medium">{decodedData.trim}</p>
                </div>
              )}
              {decodedData.body_class && (
                <div>
                  <p className="text-xs text-muted-foreground">Body Style</p>
                  <p className="font-medium">{decodedData.body_class}</p>
                </div>
              )}
              {decodedData.drive_type && (
                <div>
                  <p className="text-xs text-muted-foreground">Drivetrain</p>
                  <p className="font-medium flex items-center gap-1">
                    {decodedData.drive_type}
                    {decodedData.is_awd && (
                      <Badge variant="secondary" className="text-xs">AWD</Badge>
                    )}
                  </p>
                </div>
              )}
              {decodedData.engine_cylinders && (
                <div>
                  <p className="text-xs text-muted-foreground">Engine</p>
                  <p className="font-medium">
                    {decodedData.engine_cylinders} cyl 
                    {decodedData.engine_displacement_l && ` ${decodedData.engine_displacement_l}L`}
                  </p>
                </div>
              )}
              {decodedData.fuel_type && (
                <div>
                  <p className="text-xs text-muted-foreground">Fuel Type</p>
                  <p className="font-medium">{decodedData.fuel_type}</p>
                </div>
              )}
              {decodedData.plant_country && (
                <div>
                  <p className="text-xs text-muted-foreground">Made In</p>
                  <p className="font-medium">{decodedData.plant_country}</p>
                </div>
              )}
            </div>

            {recallData && recallData.total_recalls > 0 && (
              <div className={cn(
                'mt-4 p-3 rounded-lg border',
                recallData.summary.critical > 0 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              )}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={cn(
                    'h-4 w-4 mt-0.5',
                    recallData.summary.critical > 0 ? 'text-red-500' : 'text-yellow-500'
                  )} />
                  <div>
                    <p className="font-medium text-sm">
                      {recallData.total_recalls} Open Recall{recallData.total_recalls > 1 ? 's' : ''} Found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recallData.summary.critical > 0 && (
                        <span className="text-red-600 font-medium">
                          {recallData.summary.critical} critical recall{recallData.summary.critical > 1 ? 's' : ''}.
                          Vehicle cannot be listed until resolved.
                        </span>
                      )}
                      {recallData.summary.critical === 0 && recallData.summary.warning > 0 && (
                        <span>
                          {recallData.summary.warning} warning-level recall{recallData.summary.warning > 1 ? 's' : ''}.
                          We recommend getting these fixed.
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recalls are fixed free at any authorized dealership.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              Suggested category: <Badge variant="outline" className="text-xs capitalize">{decodedData.suggested_category}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
