'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VinReportModal } from './vin-report-modal'

interface VinBadgeProps {
  vehicleId: string
  isClean?: boolean
  hasReport?: boolean
  reportSummary?: {
    is_clean: boolean
    accident_count: number
    title_status: string
    theft_record: boolean
    odometer_rollback: boolean
    last_reported_mileage: number | null
    owner_count: number | null
    recall_count: number
    market_value?: { base: number; low: number; high: number }
    flags: {
      has_accidents: boolean
      has_salvage_title: boolean
      has_theft_record: boolean
      has_odometer_rollback: boolean
      has_open_recalls: boolean
    }
  } | null
  className?: string
}

export function VinBadge({ 
  vehicleId, 
  isClean, 
  hasReport = false, 
  reportSummary,
  className 
}: VinBadgeProps) {
  const [showModal, setShowModal] = useState(false)

  if (!hasReport) {
    return null
  }

  const isVerifiedClean = isClean ?? reportSummary?.is_clean ?? false

  return (
    <>
      <Badge
        variant={isVerifiedClean ? 'default' : 'secondary'}
        className={cn(
          "cursor-pointer transition-all hover:scale-105",
          isVerifiedClean 
            ? "bg-green-600 hover:bg-green-700" 
            : "bg-muted text-muted-foreground hover:bg-muted/80",
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowModal(true)
        }}
      >
        {isVerifiedClean ? (
          <>
            <Shield className="mr-1 h-3 w-3" />
            History Verified
          </>
        ) : (
          <>
            <FileText className="mr-1 h-3 w-3" />
            Report Available
          </>
        )}
      </Badge>

      {showModal && reportSummary && (
        <VinReportModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          vehicleId={vehicleId}
          summary={reportSummary}
        />
      )}
    </>
  )
}
