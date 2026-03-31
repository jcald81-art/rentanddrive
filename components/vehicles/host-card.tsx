'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Star, MessageCircle, Car, Calendar, Play, Pause, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface HostCardProps {
  hostId: string
  hostName: string
  hostAvatar: string
  hostRating: number
  hostTrips: number
  hostJoined: string
  hostBio?: string
  audioWalkthroughUrl?: string
  audioWalkthroughDuration?: number
}

export function HostCard({
  hostId,
  hostName,
  hostAvatar,
  hostRating,
  hostTrips,
  hostJoined,
  hostBio,
  audioWalkthroughUrl,
  audioWalkthroughDuration,
}: HostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const joinedDate = hostJoined ? format(new Date(hostJoined), 'MMMM yyyy') : 'Recently'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleAudio = () => {
    if (!audioWalkthroughUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioWalkthroughUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setProgress(0)
      }
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

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
              sizes="64px"
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

        {/* Host Bio */}
        {hostBio && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground leading-relaxed">{hostBio}</p>
          </div>
        )}

        {/* Audio Walkthrough Player */}
        {audioWalkthroughUrl && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleAudio}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20"
              >
                {isPlaying ? (
                  <Pause className="size-5 text-primary" />
                ) : (
                  <Play className="size-5 text-primary ml-0.5" />
                )}
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-primary" />
                  <span className="text-sm font-medium">Audio Walkthrough</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hostName?.split(' ')[0]} tells you about this vehicle
                  {audioWalkthroughDuration && ` · ${formatTime(audioWalkthroughDuration)}`}
                </p>
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
