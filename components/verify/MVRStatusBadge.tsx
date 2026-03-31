'use client'

import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  AlertTriangle,
  Clock
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type MVRTier = 'green' | 'yellow' | 'red' | 'auto_denied' | null
type MVRStatus = 'pending' | 'passed' | 'flagged' | 'denied' | null

interface MVRStatusBadgeProps {
  status: MVRStatus
  tier: MVRTier
  score?: number | null
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const tierConfig = {
  green: {
    label: 'Verified',
    description: 'Clean driving record',
    icon: ShieldCheck,
    className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
    iconClassName: 'text-green-600',
  },
  yellow: {
    label: 'Review',
    description: 'Minor driving history items',
    icon: ShieldAlert,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    iconClassName: 'text-yellow-600',
  },
  red: {
    label: 'Flagged',
    description: 'Driving record needs host review',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    iconClassName: 'text-red-600',
  },
  auto_denied: {
    label: 'Ineligible',
    description: 'Does not meet driving requirements',
    icon: ShieldX,
    className: 'bg-red-200 text-red-800 border-red-300 hover:bg-red-200',
    iconClassName: 'text-red-700',
  },
  pending: {
    label: 'Pending',
    description: 'Driving record check not yet completed',
    icon: Clock,
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
    iconClassName: 'text-gray-500',
  },
}

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'text-sm px-2.5 py-1',
    icon: 'h-4 w-4',
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'h-5 w-5',
  },
}

export function MVRStatusBadge({ 
  status, 
  tier, 
  score, 
  showScore = false,
  size = 'md',
  className 
}: MVRStatusBadgeProps) {
  // Determine config based on tier, falling back to status
  const configKey = tier || (status === 'pending' ? 'pending' : 'pending')
  const config = tierConfig[configKey as keyof typeof tierConfig] || tierConfig.pending
  const Icon = config.icon
  const sizeStyles = sizeConfig[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className={cn(
              config.className,
              sizeStyles.badge,
              'font-medium cursor-help flex items-center gap-1',
              className
            )}
          >
            <Icon className={cn(sizeStyles.icon, config.iconClassName)} />
            <span>{config.label}</span>
            {showScore && score !== null && score !== undefined && (
              <span className="ml-1 opacity-75">({score})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label} Driver</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {showScore && score !== null && score !== undefined && (
            <p className="text-xs mt-1">MVR Score: {score}/100</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact version for inline use
export function MVRStatusIcon({ 
  tier, 
  size = 'md',
  className 
}: { 
  tier: MVRTier
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const configKey = tier || 'pending'
  const config = tierConfig[configKey as keyof typeof tierConfig] || tierConfig.pending
  const Icon = config.icon
  const sizeStyles = sizeConfig[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icon className={cn(sizeStyles.icon, config.iconClassName, 'cursor-help', className)} />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.label} Driver</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Full verification card for profile pages
export function MVRVerificationCard({ 
  status, 
  tier, 
  score,
  lastChecked,
  recheckDue,
}: {
  status: MVRStatus
  tier: MVRTier
  score?: number | null
  lastChecked?: string | null
  recheckDue?: string | null
}) {
  const configKey = tier || (status === 'pending' ? 'pending' : 'pending')
  const config = tierConfig[configKey as keyof typeof tierConfig] || tierConfig.pending
  const Icon = config.icon

  return (
    <div className={cn(
      'rounded-lg border p-4',
      tier === 'green' && 'bg-green-50 border-green-200',
      tier === 'yellow' && 'bg-yellow-50 border-yellow-200',
      tier === 'red' && 'bg-red-50 border-red-200',
      tier === 'auto_denied' && 'bg-red-100 border-red-300',
      (!tier || status === 'pending') && 'bg-gray-50 border-gray-200',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          tier === 'green' && 'bg-green-100',
          tier === 'yellow' && 'bg-yellow-100',
          tier === 'red' && 'bg-red-100',
          tier === 'auto_denied' && 'bg-red-200',
          (!tier || status === 'pending') && 'bg-gray-100',
        )}>
          <Icon className={cn('h-5 w-5', config.iconClassName)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">Driving Record</h4>
            <MVRStatusBadge status={status} tier={tier} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {config.description}
          </p>
          {score !== null && score !== undefined && (
            <div className="flex items-center gap-4 text-sm">
              <span>
                <span className="font-medium">{score}</span>
                <span className="text-muted-foreground">/100</span>
              </span>
              {lastChecked && (
                <span className="text-muted-foreground">
                  Last checked: {new Date(lastChecked).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          {recheckDue && (
            <p className="text-xs text-muted-foreground mt-2">
              Annual recheck due: {new Date(recheckDue).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
