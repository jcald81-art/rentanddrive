'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  ShieldCheck, 
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Star,
  Car,
  MessageSquare
} from 'lucide-react'
import { MVRStatusBadge } from '@/components/verify/MVRStatusBadge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type MVRTier = 'green' | 'yellow' | 'red' | 'auto_denied' | null
type MVRStatus = 'pending' | 'passed' | 'flagged' | 'denied' | null

interface RenterInfo {
  id: string
  name: string
  avatarUrl?: string
  memberSince?: string
  totalTrips?: number
  rating?: number
  identityVerified?: boolean
  mvrStatus?: MVRStatus
  mvrTier?: MVRTier
  mvrScore?: number
}

interface RenterVerificationCardProps {
  renter: RenterInfo
  onApprove?: () => void
  onDeny?: () => void
  onMessage?: () => void
  showActions?: boolean
  isLoading?: boolean
}

export function RenterVerificationCard({ 
  renter, 
  onApprove, 
  onDeny, 
  onMessage,
  showActions = true,
  isLoading = false,
}: RenterVerificationCardProps) {
  const initials = renter.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Determine if host should review
  const needsReview = renter.mvrTier === 'yellow' || renter.mvrTier === 'red'
  const isIneligible = renter.mvrTier === 'auto_denied' || renter.mvrStatus === 'denied'
  const isVerified = renter.mvrTier === 'green' && renter.identityVerified

  return (
    <Card className={cn(
      'border-2',
      needsReview && 'border-yellow-300 bg-yellow-50/30',
      isIneligible && 'border-red-300 bg-red-50/30',
      isVerified && 'border-green-300 bg-green-50/30',
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Renter Information
          </CardTitle>
          {needsReview && (
            <Badge className="bg-yellow-500 text-white">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Review Required
            </Badge>
          )}
          {isIneligible && (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Ineligible
            </Badge>
          )}
          {isVerified && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Renter Profile */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={renter.avatarUrl} alt={renter.name} />
            <AvatarFallback className="bg-[#CC0000]/10 text-[#CC0000] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{renter.name}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {renter.memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {renter.memberSince}
                </span>
              )}
              {renter.totalTrips !== undefined && (
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {renter.totalTrips} trips
                </span>
              )}
              {renter.rating !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {renter.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="grid grid-cols-2 gap-3">
          {/* Identity Verification */}
          <div className={cn(
            'rounded-lg p-3 border',
            renter.identityVerified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-1">
              {renter.identityVerified ? (
                <ShieldCheck className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Identity</span>
            </div>
            <span className={cn(
              'text-xs',
              renter.identityVerified ? 'text-green-700' : 'text-muted-foreground'
            )}>
              {renter.identityVerified ? 'Verified' : 'Not verified'}
            </span>
          </div>

          {/* MVR Status */}
          <div className={cn(
            'rounded-lg p-3 border',
            renter.mvrTier === 'green' && 'bg-green-50 border-green-200',
            renter.mvrTier === 'yellow' && 'bg-yellow-50 border-yellow-200',
            renter.mvrTier === 'red' && 'bg-red-50 border-red-200',
            renter.mvrTier === 'auto_denied' && 'bg-red-100 border-red-300',
            !renter.mvrTier && 'bg-gray-50 border-gray-200',
          )}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Driving Record</span>
            </div>
            <MVRStatusBadge 
              status={renter.mvrStatus || null} 
              tier={renter.mvrTier || null}
              score={renter.mvrScore}
              showScore={true}
              size="sm"
            />
          </div>
        </div>

        {/* Warning for flagged renters */}
        {needsReview && (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Driving Record Flagged
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This renter has items on their driving record. Review their score 
                  ({renter.mvrScore}/100) and decide if you&apos;re comfortable approving this booking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ineligible warning */}
        {isIneligible && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-start gap-2">
              <ShieldX className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Renter Ineligible
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This renter does not meet minimum driving requirements. 
                  You cannot approve this booking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onMessage}
              disabled={isLoading}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onDeny}
              disabled={isLoading}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1">
                    <Button 
                      size="sm"
                      onClick={onApprove}
                      disabled={isLoading || isIneligible}
                      className={cn(
                        "w-full",
                        isIneligible 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </span>
                </TooltipTrigger>
                {isIneligible && (
                  <TooltipContent>
                    <p>Cannot approve ineligible renters</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact badge for booking lists
export function RenterMVRIndicator({ 
  tier, 
  identityVerified = false,
}: { 
  tier: MVRTier
  identityVerified?: boolean
}) {
  if (!tier && !identityVerified) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="text-xs bg-gray-100">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Verification pending</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {identityVerified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Identity verified</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {tier && (
        <MVRStatusBadge status={null} tier={tier} size="sm" />
      )}
    </div>
  )
}
