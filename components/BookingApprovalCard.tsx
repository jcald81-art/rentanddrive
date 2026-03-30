'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrustScoreBadge } from './TrustScoreBadge'
import { Zap, MessageSquare, User, Calendar, Car } from 'lucide-react'

interface BookingApprovalCardProps {
  booking: {
    id: string
    renter: {
      id: string
      name: string
      memberSince: string
      photoUrl?: string
    }
    vehicle: {
      name: string
      dates: string
    }
    trustScore: number
    breakdown: {
      idVerified: boolean
      noIncidents: boolean
      completedRentals: number
      accountAgeDays: number
      avgRating: number
      profileComplete: boolean
    }
    meetsThreshold: boolean
    hostThreshold: number
  }
  onApprove?: (bookingId: string) => void
  onDecline?: (bookingId: string) => void
  onMessage?: (renterId: string) => void
}

export function BookingApprovalCard({ booking, onApprove, onDecline, onMessage }: BookingApprovalCardProps) {
  const [loading, setLoading] = useState<'approve' | 'decline' | null>(null)

  const handleApprove = async () => {
    setLoading('approve')
    try {
      await onApprove?.(booking.id)
    } finally {
      setLoading(null)
    }
  }

  const handleDecline = async () => {
    setLoading('decline')
    try {
      await onDecline?.(booking.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Renter Photo */}
            <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
              {booking.renter.photoUrl ? (
                <img src={booking.renter.photoUrl} alt={booking.renter.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-zinc-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{booking.renter.name}</CardTitle>
              <p className="text-sm text-zinc-500">Member since {booking.renter.memberSince}</p>
            </div>
          </div>
          {booking.meetsThreshold && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Instant Book Eligible
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Details */}
        <div className="flex gap-4 p-3 rounded-lg bg-zinc-800/50">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-300">{booking.vehicle.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span className="text-zinc-300">{booking.vehicle.dates}</span>
          </div>
        </div>

        {/* Trust Score */}
        <TrustScoreBadge 
          score={booking.trustScore} 
          size="lg" 
          breakdown={booking.breakdown}
          showBreakdown
        />

        {/* Threshold Info */}
        {!booking.meetsThreshold && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
            <p className="text-red-400">
              Score {booking.trustScore} is below your threshold of {booking.hostThreshold}. Manual approval required.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {booking.meetsThreshold ? (
            <p className="text-sm text-green-400 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              This booking will be auto-approved
            </p>
          ) : (
            <>
              <Button 
                onClick={handleApprove}
                disabled={loading !== null}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {loading === 'approve' ? 'Approving...' : 'Approve'}
              </Button>
              <Button 
                onClick={handleDecline}
                disabled={loading !== null}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                {loading === 'decline' ? 'Declining...' : 'Decline'}
              </Button>
            </>
          )}
          <Button 
            onClick={() => onMessage?.(booking.renter.id)}
            variant="outline"
            className="border-zinc-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
