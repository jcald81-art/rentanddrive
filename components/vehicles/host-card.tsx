'use client'

import Image from 'next/image'
import { format } from 'date-fns'
import { Star, MessageCircle, Car, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface HostCardProps {
  hostId: string
  hostName: string
  hostAvatar: string
  hostRating: number
  hostTrips: number
  hostJoined: string
}

export function HostCard({
  hostId,
  hostName,
  hostAvatar,
  hostRating,
  hostTrips,
  hostJoined,
}: HostCardProps) {
  const joinedDate = hostJoined ? format(new Date(hostJoined), 'MMMM yyyy') : 'Recently'

  return (
    <Card className="mt-8">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Meet your host</h2>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
            <Image
              src={hostAvatar || '/placeholder-avatar.jpg'}
              alt={hostName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{hostName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-primary text-primary" />
                <span className="font-medium text-foreground">
                  {hostRating?.toFixed(1) || 'New'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Car className="size-4" />
                <span>{hostTrips || 0} trips</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" className="mt-4 w-full gap-2">
          <MessageCircle className="size-4" />
          Contact {hostName?.split(' ')[0] || 'Host'}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Response rate: 98% · Typically responds within 1 hour
        </p>
      </CardContent>
    </Card>
  )
}
