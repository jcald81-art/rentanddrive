'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, AlertTriangle, Shield, Car, FileSearch, Loader2, Radar, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface VinCheckWidgetProps {
  vin?: string
  onVinChange?: (vin: string) => void
  onDecoded?: (data: DecodedVin) => void
  onReportComplete?: (report: VinReport) => void
  vehicleId?: string
  userId?: string
  showInput?: boolean
}

interface DecodedVin {
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  body_style: string | null
  drive_type: string | null
  fuel_type: string | null
  engine: {
    cylinders: string | null
    displacement: string | null
  }
  transmission: string | null
}

interface VinReport {
  vin: string
  report_id: string
  title_status: string
  accident_count: number
  owner_count: number
  odometer_rollback: boolean
  last_reported_mileage: number | null
  market_value: { base: number; low: number; high: number }
  open_recalls: any[]
  recall_count: number
  is_clean: boolean
  flags: {
    has_accidents: boolean
    has_salvage_title: boolean
    has_theft_record: boolean
    has_odometer_rollback: boolean
    has_open_recalls: boolean
  }
}

export function VinCheckWidget({ 
  vin: initialVin = '',
  onVinChange,
  onDecoded,
  onReportComplete,
  vehicleId,
  userId,
  showInput = true,
}: VinCheckWidgetProps) {
  const [vin, setVin] = useState(initialVin)
  const [isDecoding, setIsDecoding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [decoded, setDecoded] = useState<DecodedVin | null>(null)
  const [nhtsaResult, setNhtsaResult] = useState<{ count: number; items: any[] } | null>(null)
  const [fullReport, setFullReport] = useState<VinReport | null>(null)
  const [eagleVerified, setEagleVerified] = useState(false)

  // Auto-decode when VIN reaches 17 characters
  useEffect(() => {
    if (vin.length === 17) {
      handleDecode()
    }
  }, [vin])

  const handleVinChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[IOQ]/g, '').slice(0, 17)
    setVin(formatted)
    onVinChange?.(formatted)
    
    // Reset results when VIN changes
    if (formatted.length !== 17) {
      setDecoded(null)
      setNhtsaResult(null)
      setFullReport(null)
    }
  }

  const handleDecode = async () => {
    if (vin.length !== 17) return

    setIsDecoding(true)
    try {
      const res = await fetch(`/api/vin/decode?vin=${vin}`)
      const data = await res.json()

      if (data.valid && data.decoded) {
        setDecoded(data.decoded)
        onDecoded?.(data.decoded)
        toast.success(`Vehicle identified: ${data.decoded.year} ${data.decoded.make} ${data.decoded.model}`)
      } else {
        toast.error(data.error || 'Failed to decode VIN')
      }
    } catch (err) {
      toast.error('Failed to decode VIN')
    } finally {
      setIsDecoding(false)
    }
  }

  const handleFreeNhtsaCheck = async () => {
    if (vin.length !== 17) return

    setIsChecking(true)
    try {
      const res = await fetch('/api/vin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, full_report: false }),
      })
      const data = await res.json()

      if (data.valid) {
        setNhtsaResult(data.recalls)
        if (data.recalls.count === 0) {
          toast.success('No open recalls found!')
        } else {
          toast.warning(`${data.recalls.count} open recall(s) found`)
        }
      } else {
        toast.error(data.error || 'Failed to check VIN')
      }
    } catch (err) {
      toast.error('Failed to check VIN')
    } finally {
      setIsChecking(false)
    }
  }

  const handleFullReport = async () => {
    if (vin.length !== 17) return

    setIsChecking(true)
    try {
      // In production, this would go through Stripe checkout
      // For Level 1, we'll call the API directly (payment handled separately)
      const res = await fetch('/api/vin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vin, 
          full_report: true,
          vehicle_id: vehicleId,
          user_id: userId,
        }),
      })
      const data = await res.json()

      if (data.valid && data.report) {
        setFullReport(data.report)
        onReportComplete?.(data.report)
        
        if (data.blocked) {
          toast.error('This vehicle has been flagged and cannot be listed.')
        } else if (data.report.is_clean) {
          toast.success('Clean history verified!')
        } else {
          toast.warning('Report shows some flags - review details below')
        }
      } else {
        toast.error(data.error || 'Failed to get report')
      }
    } catch (err) {
      toast.error('Failed to get report')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* VIN Input */}
      {showInput && (
        <div className="space-y-2">
          <Label htmlFor="vin">Vehicle Identification Number (VIN)</Label>
          <div className="flex gap-2">
            <Input
              id="vin"
              value={vin}
              onChange={(e) => handleVinChange(e.target.value)}
              placeholder="Enter 17-character VIN"
              maxLength={17}
              className="font-mono uppercase"
            />
            {isDecoding && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground self-center" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {vin.length}/17 characters {vin.length === 17 && '✓'}
          </p>
        </div>
      )}

      {/* Decoded Vehicle Info */}
      {decoded && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-green-600" />
              Vehicle Identified
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Year:</span> {decoded.year}</div>
              <div><span className="text-muted-foreground">Make:</span> {decoded.make}</div>
              <div><span className="text-muted-foreground">Model:</span> {decoded.model}</div>
              <div><span className="text-muted-foreground">Trim:</span> {decoded.trim || 'N/A'}</div>
              <div><span className="text-muted-foreground">Body:</span> {decoded.body_style || 'N/A'}</div>
              <div><span className="text-muted-foreground">Drive:</span> {decoded.drive_type || 'N/A'}</div>
            </div>
            {eagleVerified && (
              <Badge className="mt-2 bg-[#CC0000]">
                <Radar className="h-3 w-3 mr-1" />
                Eagle Verified - Bouncie GPS Registered
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Check Options */}
      {decoded && !fullReport && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              CarFidelity Vehicle History
            </CardTitle>
            <CardDescription>
              Diesel checks this vehicle&apos;s history. No sugarcoating, just facts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Free NHTSA Check */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Free NHTSA Check</p>
                <p className="text-sm text-muted-foreground">Recall status only, instant</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleFreeNhtsaCheck}
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check Free'}
              </Button>
            </div>

            {/* NHTSA Result */}
            {nhtsaResult && (
              <div className={cn(
                "p-3 rounded-lg",
                nhtsaResult.count === 0 ? "bg-green-500/10" : "bg-amber-500/10"
              )}>
                <div className="flex items-center gap-2">
                  {nhtsaResult.count === 0 ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">No Open Recalls</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-600">
                        {nhtsaResult.count} Open Recall(s)
                      </span>
                    </>
                  )}
                </div>
                {nhtsaResult.count > 0 && (
                  <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                    {nhtsaResult.items.slice(0, 3).map((r, i) => (
                      <li key={i}>• {r.component}: {r.summary?.slice(0, 100)}...</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Full Report */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#CC0000]/30 bg-[#CC0000]/5">
              <div>
                <p className="font-medium flex items-center gap-2">
                  CarFidelity Report
                  <Badge variant="secondary" className="text-xs">Diesel Verified</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  Full history check. Diesel tells it like it is.
                </p>
              </div>
              <Button 
                className="bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={handleFullReport}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-1" />
                    $9.99
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Report Results */}
      {fullReport && (
        <Card className={cn(
          "border-2",
          fullReport.is_clean ? "border-green-500" : "border-amber-500"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {fullReport.is_clean ? (
                  <>
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">CarFidelity Verified by Diesel</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-600">Diesel Found Issues</span>
                  </>
                )}
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {fullReport.report_id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Title Status */}
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Title Status</span>
              <Badge className={fullReport.title_status === 'clean' ? 'bg-green-600' : 'bg-red-600'}>
                {fullReport.title_status.toUpperCase()}
              </Badge>
            </div>

            {/* Accident Count */}
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Accidents</span>
              <span className={cn(
                "text-sm font-medium",
                fullReport.accident_count === 0 ? "text-green-600" : "text-red-600"
              )}>
                {fullReport.accident_count === 0 ? 'None found' : `${fullReport.accident_count} reported`}
              </span>
            </div>

            {/* Owner Count */}
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Previous Owners</span>
              <span className="text-sm font-medium">{fullReport.owner_count}</span>
            </div>

            {/* Odometer */}
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Odometer</span>
              <span className={cn(
                "text-sm font-medium",
                !fullReport.odometer_rollback ? "text-green-600" : "text-red-600"
              )}>
                {fullReport.odometer_rollback ? 'Rollback Detected!' : 'Consistent'}
              </span>
            </div>

            {/* Last Mileage */}
            {fullReport.last_reported_mileage && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Last Reported Mileage</span>
                <span className="text-sm font-medium">
                  {fullReport.last_reported_mileage.toLocaleString()} miles
                </span>
              </div>
            )}

            {/* Open Recalls */}
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Open Recalls</span>
              <span className={cn(
                "text-sm font-medium",
                fullReport.recall_count === 0 ? "text-green-600" : "text-amber-600"
              )}>
                {fullReport.recall_count === 0 ? 'None' : `${fullReport.recall_count} active`}
              </span>
            </div>

            {/* Market Value */}
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Market Value</span>
              <span className="text-sm font-medium text-primary">
                ${fullReport.market_value.low.toLocaleString()} - ${fullReport.market_value.high.toLocaleString()}
              </span>
            </div>

            {/* Recall Details */}
            {fullReport.open_recalls.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10">
                <p className="text-sm font-medium text-amber-600 mb-2">Open Recalls:</p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  {fullReport.open_recalls.slice(0, 3).map((r, i) => (
                    <li key={i} className="border-l-2 border-amber-500 pl-2">
                      <strong>{r.component}</strong>: {r.summary?.slice(0, 150)}...
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-center text-muted-foreground">
        CarFidelity Reports - Powered by Diesel. Data from NHTSA & VinAudit.
      </p>
    </div>
  )
}
