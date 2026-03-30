'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  AlertTriangle, 
  Check, 
  X, 
  Car, 
  Gauge, 
  Users, 
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface VinReportModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  summary: {
    is_clean: boolean
    accident_count: number
    title_status: string
    theft_record: boolean
    odometer_rollback: boolean
    last_reported_mileage: number | null
    owner_count: number | null
    recall_count: number
    market_value?: { base: number; low: number; high: number }
    accidents?: Array<{
      date: string
      location: string
      damage_area: string
      severity: string
    }>
    open_recalls?: Array<{
      campaign_number: string
      component: string
      summary: string
      consequence: string
    }>
    specifications?: Record<string, string>
    flags: {
      has_accidents: boolean
      has_salvage_title: boolean
      has_theft_record: boolean
      has_odometer_rollback: boolean
      has_open_recalls: boolean
      has_active_liens?: boolean
    }
  }
}

export function VinReportModal({ 
  isOpen, 
  onClose, 
  vehicleId, 
  summary 
}: VinReportModalProps) {
  const StatusRow = ({ 
    icon: Icon, 
    label, 
    value, 
    status 
  }: { 
    icon: React.ElementType
    label: string
    value: string
    status: 'good' | 'warning' | 'neutral'
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          status === 'good' && "bg-green-100 text-green-600",
          status === 'warning' && "bg-red-100 text-red-600",
          status === 'neutral' && "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-sm font-medium",
          status === 'good' && "text-green-600",
          status === 'warning' && "text-red-600",
          status === 'neutral' && "text-foreground"
        )}>
          {value}
        </span>
        {status === 'good' && <Check className="h-4 w-4 text-green-600" />}
        {status === 'warning' && <X className="h-4 w-4 text-red-600" />}
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {summary.is_clean ? (
              <Shield className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            )}
            <DialogTitle>Vehicle History Report</DialogTitle>
          </div>
          <DialogDescription>
            {summary.is_clean 
              ? 'This vehicle has a clean history with no major issues reported.'
              : 'This vehicle has some items that may require attention.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant="outline"
              className={cn(
                "text-lg py-2 px-4",
                summary.is_clean 
                  ? "border-green-500 text-green-600 bg-green-50" 
                  : "border-amber-500 text-amber-600 bg-amber-50"
              )}
            >
              {summary.is_clean ? 'Clean History' : 'Review Recommended'}
            </Badge>
          </div>

          <Separator />

          {/* Key Checks */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              History Checks
            </h4>
            
            <StatusRow 
              icon={Car}
              label="Accident History"
              value={summary.accident_count === 0 ? 'No accidents' : `${summary.accident_count} accident(s)`}
              status={summary.accident_count === 0 ? 'good' : 'warning'}
            />
            
            <StatusRow 
              icon={Shield}
              label="Title Status"
              value={summary.title_status === 'clean' ? 'Clean Title' : 'Salvage/Rebuilt'}
              status={summary.title_status === 'clean' ? 'good' : 'warning'}
            />
            
            <StatusRow 
              icon={AlertCircle}
              label="Theft Record"
              value={summary.theft_record ? 'Record Found' : 'No Record'}
              status={summary.theft_record ? 'warning' : 'good'}
            />
            
            <StatusRow 
              icon={Gauge}
              label="Odometer"
              value={summary.odometer_rollback ? 'Rollback Detected' : 'Verified'}
              status={summary.odometer_rollback ? 'warning' : 'good'}
            />
          </div>

          <Separator />

          {/* Additional Details */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Vehicle Details
            </h4>

            {summary.last_reported_mileage && (
              <StatusRow 
                icon={Gauge}
                label="Last Reported Mileage"
                value={`${summary.last_reported_mileage.toLocaleString()} miles`}
                status="neutral"
              />
            )}

            {summary.owner_count !== null && (
              <StatusRow 
                icon={Users}
                label="Previous Owners"
                value={`${summary.owner_count} owner(s)`}
                status="neutral"
              />
            )}

            {summary.recall_count > 0 && (
              <StatusRow 
                icon={AlertTriangle}
                label="Open Recalls"
                value={`${summary.recall_count} active`}
                status="warning"
              />
            )}
          </div>

          {/* Market Value */}
          {summary.market_value && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Market Value
                </h4>
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                    <DollarSign className="h-6 w-6" />
                    {summary.market_value.base.toLocaleString()}
                  </div>
                  <div className="text-center text-sm text-muted-foreground mt-1">
                    Range: ${summary.market_value.low.toLocaleString()} - ${summary.market_value.high.toLocaleString()}
                  </div>
                  {/* Value bar */}
                  <div className="mt-3 relative h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ 
                        width: `${((summary.market_value.base - summary.market_value.low) / (summary.market_value.high - summary.market_value.low)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Accident Timeline */}
          {summary.accidents && summary.accidents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Accident History
                </h4>
                <div className="space-y-3">
                  {summary.accidents.map((accident, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">{accident.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {accident.location} - {accident.damage_area}
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {accident.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Open Recalls */}
          {summary.open_recalls && summary.open_recalls.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Open Recalls
                </h4>
                <div className="space-y-2">
                  {summary.open_recalls.map((recall, i) => (
                    <div key={i} className="p-3 bg-amber-50 rounded-lg">
                      <div className="text-sm font-medium">{recall.component}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {recall.summary}
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Campaign: {recall.campaign_number}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* CTA */}
          <div className="bg-primary/5 rounded-lg p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              This vehicle is verified and listed on Rent and Drive
            </p>
            <Button asChild className="w-full">
              <Link href={`/vehicles/${vehicleId}`}>
                Book Now
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
