'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VinReportModal } from './vin-report-modal'

interface VinBadgeProps {
  vehicleId: string
  hasReport?: boolean
  isClean?: boolean
  reportSummary?: {
    report_id?: string
    is_clean: boolean
    accident_count: number
    title_status: string
    theft_record?: boolean
    odometer_rollback: boolean
    last_reported_mileage: number | null
    owner_count: number | null
    recall_count: number
    market_value?: { base: number; low: number; high: number }
    flags?: {
      has_accidents: boolean
      has_salvage_title: boolean
      has_theft_record: boolean
      has_odometer_rollback: boolean
      has_open_recalls: boolean
    }
  } | null
  className?: string
  size?: 'sm' | 'md'
}

export function VinBadge({ 
  vehicleId, 
  hasReport = false,
  isClean,
  reportSummary,
  className,
  size = 'sm',
}: VinBadgeProps) {
  const [showModal, setShowModal] = useState(false)

  // No badge if no report
  if (!hasReport && !reportSummary) {
    return null
  }

  // Determine status
  const isVerifiedClean = isClean ?? reportSummary?.is_clean ?? false
  const hasFlags = reportSummary?.flags && (
    reportSummary.flags.has_accidents ||
    reportSummary.flags.has_salvage_title ||
    reportSummary.flags.has_odometer_rollback
  )

  // Green: Clean report
  // Yellow: Report exists with flags
  // No badge: No report
  
  return (
    <>
      <Badge
        variant="secondary"
        className={cn(
          "cursor-pointer transition-all hover:scale-105 gap-1",
          isVerifiedClean && !hasFlags
            ? "bg-green-600 text-white hover:bg-green-700" 
            : "bg-amber-500 text-white hover:bg-amber-600",
          size === 'sm' ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowModal(true)
        }}
      >
        {isVerifiedClean && !hasFlags ? (
          <>
            <Shield className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
            History Verified
          </>
        ) : (
          <>
            <AlertTriangle className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
            Report Available
          </>
        )}
      </Badge>

      {showModal && (
        <VinReportModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          vehicleId={vehicleId}
          summary={reportSummary || {
            is_clean: isVerifiedClean,
            accident_count: 0,
            title_status: 'clean',
            odometer_rollback: false,
            last_reported_mileage: null,
            owner_count: null,
            recall_count: 0,
          }}
        />
      )}
    </>
  )
}
