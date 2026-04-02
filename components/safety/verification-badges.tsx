'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Shield, FileCheck, Car, Zap, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationStatus {
  status: 'verified' | 'pending' | 'failed' | 'expired' | 'not_started'
  expiresAt?: string
  details?: string
}

interface VerificationBadgesProps {
  mvr?: VerificationStatus
  insurance?: VerificationStatus
  smartcar?: { connected: boolean; lastSync?: string }
  tesla?: { connected: boolean; sentryEnabled?: boolean }
  blockchain?: { verified: boolean; chain?: string }
  className?: string
  compact?: boolean
}

export function VerificationBadges({
  mvr,
  insurance,
  smartcar,
  tesla,
  blockchain,
  className,
  compact = false,
}: VerificationBadgesProps) {
  const badges = []

  // MVR Badge
  if (mvr) {
    badges.push(
      <VerificationBadge
        key="mvr"
        icon={<FileCheck className="h-3.5 w-3.5" />}
        label="MVR"
        status={mvr.status}
        tooltip={getMVRTooltip(mvr)}
        compact={compact}
      />
    )
  }

  // Insurance Badge
  if (insurance) {
    badges.push(
      <VerificationBadge
        key="insurance"
        icon={<Shield className="h-3.5 w-3.5" />}
        label="Insurance"
        status={insurance.status}
        tooltip={getInsuranceTooltip(insurance)}
        compact={compact}
      />
    )
  }

  // Smartcar Badge
  if (smartcar) {
    badges.push(
      <VerificationBadge
        key="smartcar"
        icon={<Car className="h-3.5 w-3.5" />}
        label="Connected"
        status={smartcar.connected ? 'verified' : 'not_started'}
        tooltip={smartcar.connected 
          ? `Vehicle connected via Smartcar${smartcar.lastSync ? `. Last sync: ${new Date(smartcar.lastSync).toLocaleString()}` : ''}`
          : 'Connect your vehicle for remote lock/unlock'
        }
        compact={compact}
      />
    )
  }

  // Tesla Badge
  if (tesla?.connected) {
    badges.push(
      <VerificationBadge
        key="tesla"
        icon={<Zap className="h-3.5 w-3.5" />}
        label="Tesla"
        status="verified"
        tooltip={`Tesla Fleet connected${tesla.sentryEnabled ? ' - Sentry Mode enabled' : ''}`}
        compact={compact}
        variant="tesla"
      />
    )
  }

  // Blockchain Badge
  if (blockchain?.verified) {
    badges.push(
      <VerificationBadge
        key="blockchain"
        icon={
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        }
        label="On-Chain"
        status="verified"
        tooltip={`Verified on ${blockchain.chain || 'Base'} blockchain`}
        compact={compact}
        variant="blockchain"
      />
    )
  }

  if (badges.length === 0) return null

  return (
    <TooltipProvider>
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {badges}
      </div>
    </TooltipProvider>
  )
}

interface VerificationBadgeProps {
  icon: React.ReactNode
  label: string
  status: VerificationStatus['status']
  tooltip: string
  compact?: boolean
  variant?: 'default' | 'tesla' | 'blockchain'
}

function VerificationBadge({ icon, label, status, tooltip, compact, variant = 'default' }: VerificationBadgeProps) {
  const statusConfig = {
    verified: {
      bg: variant === 'tesla' 
        ? 'bg-[#cc0000]/10 text-[#cc0000] border-[#cc0000]/30'
        : variant === 'blockchain'
        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    pending: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <Clock className="h-3 w-3" />,
    },
    failed: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <XCircle className="h-3 w-3" />,
    },
    expired: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    not_started: {
      bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      icon: null,
    },
  }

  const config = statusConfig[status]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'cursor-default border transition-colors',
            config.bg,
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
          )}
        >
          <span className="flex items-center gap-1">
            {icon}
            {!compact && <span>{label}</span>}
            {config.icon}
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function getMVRTooltip(mvr: VerificationStatus): string {
  switch (mvr.status) {
    case 'verified':
      return `Driving record verified${mvr.expiresAt ? `. Valid until ${new Date(mvr.expiresAt).toLocaleDateString()}` : ''}`
    case 'pending':
      return 'MVR check in progress - typically completes within 24 hours'
    case 'failed':
      return mvr.details || 'Driving record check failed'
    case 'expired':
      return 'MVR verification has expired. Please re-verify.'
    default:
      return 'Driving record not yet verified'
  }
}

function getInsuranceTooltip(insurance: VerificationStatus): string {
  switch (insurance.status) {
    case 'verified':
      return `Insurance verified${insurance.expiresAt ? `. Valid until ${new Date(insurance.expiresAt).toLocaleDateString()}` : ''}`
    case 'pending':
      return 'Insurance verification in progress'
    case 'failed':
      return insurance.details || 'Insurance verification failed - coverage may be insufficient'
    case 'expired':
      return 'Insurance policy has expired. Please update your coverage.'
    default:
      return 'Insurance not yet verified'
  }
}

// Renter Verification Summary Component
interface RenterVerificationProps {
  userId: string
  mvrStatus?: string
  mvrClearedAt?: string
  insuranceVerified?: boolean
  insuranceVerifiedAt?: string
  fraudRiskLevel?: string
  className?: string
}

export function RenterVerificationSummary({
  mvrStatus,
  mvrClearedAt,
  insuranceVerified,
  insuranceVerifiedAt,
  fraudRiskLevel,
  className,
}: RenterVerificationProps) {
  const isFullyVerified = mvrStatus === 'clear' && insuranceVerified && fraudRiskLevel === 'normal'

  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Verification Status</h4>
        {isFullyVerified && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Fully Verified
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        <VerificationRow
          label="Driving Record"
          status={mvrStatus === 'clear' ? 'verified' : mvrStatus === 'pending' ? 'pending' : 'not_started'}
          detail={mvrClearedAt ? `Verified ${new Date(mvrClearedAt).toLocaleDateString()}` : undefined}
        />
        <VerificationRow
          label="Insurance Coverage"
          status={insuranceVerified ? 'verified' : 'not_started'}
          detail={insuranceVerifiedAt ? `Verified ${new Date(insuranceVerifiedAt).toLocaleDateString()}` : undefined}
        />
        <VerificationRow
          label="Fraud Risk"
          status={fraudRiskLevel === 'normal' ? 'verified' : fraudRiskLevel === 'elevated' ? 'pending' : 'failed'}
          detail={fraudRiskLevel === 'normal' ? 'Low risk' : `Risk level: ${fraudRiskLevel}`}
        />
      </div>
    </div>
  )
}

function VerificationRow({ 
  label, 
  status, 
  detail 
}: { 
  label: string
  status: 'verified' | 'pending' | 'not_started' | 'failed'
  detail?: string 
}) {
  const icons = {
    verified: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    pending: <Clock className="h-4 w-4 text-amber-400" />,
    not_started: <div className="h-4 w-4 rounded-full border-2 border-gray-500" />,
    failed: <XCircle className="h-4 w-4 text-red-400" />,
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        {icons[status]}
        <span className="text-white/80">{label}</span>
      </div>
      {detail && <span className="text-white/50 text-xs">{detail}</span>}
    </div>
  )
}

// Vehicle EV Status Component
interface EVStatusProps {
  batteryPercent?: number
  rangeKm?: number
  isCharging?: boolean
  preconditioning?: boolean
  sentryMode?: boolean
  lastSync?: string
  className?: string
}

export function EVStatusIndicator({
  batteryPercent,
  rangeKm,
  isCharging,
  preconditioning,
  sentryMode,
  lastSync,
  className,
}: EVStatusProps) {
  if (batteryPercent === undefined) return null

  const getBatteryColor = () => {
    if (isCharging) return 'text-green-400'
    if (batteryPercent > 50) return 'text-emerald-400'
    if (batteryPercent > 20) return 'text-amber-400'
    return 'text-red-400'
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Battery indicator */}
      <div className="flex items-center gap-1.5">
        <div className="relative w-8 h-4 border border-white/30 rounded-sm">
          <div 
            className={cn('absolute inset-y-0.5 left-0.5 rounded-sm transition-all', getBatteryColor().replace('text-', 'bg-'))}
            style={{ width: `${Math.min(batteryPercent, 100) * 0.9}%` }}
          />
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-white/30 rounded-r" />
        </div>
        <span className={cn('text-sm font-medium', getBatteryColor())}>
          {batteryPercent.toFixed(0)}%
        </span>
      </div>

      {/* Range */}
      {rangeKm !== undefined && (
        <span className="text-sm text-white/60">
          {(rangeKm * 0.621371).toFixed(0)} mi
        </span>
      )}

      {/* Status badges */}
      <div className="flex items-center gap-1">
        {isCharging && (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs px-1.5">
            <Zap className="h-3 w-3 mr-0.5" />
            Charging
          </Badge>
        )}
        {preconditioning && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-1.5">
            Climate
          </Badge>
        )}
        {sentryMode && (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs px-1.5">
            Sentry
          </Badge>
        )}
      </div>

      {/* Last sync */}
      {lastSync && (
        <span className="text-xs text-white/40">
          {new Date(lastSync).toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
