'use client'

import { Shield, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface RecallBadgeProps {
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | null
  recallCount?: number
  showTooltip?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RecallBadge({ 
  severity, 
  recallCount = 0, 
  showTooltip = true,
  size = 'md',
  className 
}: RecallBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  // No recalls = Safety Verified
  if (!severity || recallCount === 0) {
    const badge = (
      <Badge 
        className={cn(
          'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
          sizeClasses[size],
          className
        )}
      >
        <Shield className={cn(iconSizes[size], 'mr-1')} />
        Safety Verified
      </Badge>
    )

    if (!showTooltip) return badge

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>No open safety recalls found for this vehicle.</p>
            <p className="text-xs text-muted-foreground mt-1">Verified with NHTSA database</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Critical recall
  if (severity === 'CRITICAL') {
    const badge = (
      <Badge 
        variant="destructive"
        className={cn(
          'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 animate-pulse',
          sizeClasses[size],
          className
        )}
      >
        <AlertCircle className={cn(iconSizes[size], 'mr-1')} />
        Safety Recall Open
      </Badge>
    )

    if (!showTooltip) return badge

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold text-red-600">Critical Safety Recall</p>
            <p className="text-sm mt-1">
              This vehicle has {recallCount} open recall{recallCount > 1 ? 's' : ''} affecting 
              critical safety components. Vehicle cannot be booked until resolved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recalls can be fixed free at any authorized dealership.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Warning recall
  if (severity === 'WARNING') {
    const badge = (
      <Badge 
        className={cn(
          'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
          sizeClasses[size],
          className
        )}
      >
        <AlertTriangle className={cn(iconSizes[size], 'mr-1')} />
        Open Recall - Check Details
      </Badge>
    )

    if (!showTooltip) return badge

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold text-yellow-600">Open Recall Notice</p>
            <p className="text-sm mt-1">
              This vehicle has {recallCount} open recall{recallCount > 1 ? 's' : ''}. 
              Check the details below before booking.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Info recall (minor)
  const badge = (
    <Badge 
      className={cn(
        'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
        sizeClasses[size],
        className
      )}
    >
      <CheckCircle className={cn(iconSizes[size], 'mr-1')} />
      Minor Recall Notice
    </Badge>
  )

  if (!showTooltip) return badge

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Minor recall notice - does not affect vehicle safety.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
