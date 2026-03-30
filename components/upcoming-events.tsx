'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  MapPin, 
  TrendingUp, 
  Music, 
  Trophy,
  Building2,
  PartyPopper,
  Snowflake,
  Mountain,
  Users,
  Flame,
  Info
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LocalEvent {
  id: string
  name: string
  venue: string
  date: string
  endDate?: string
  category: 'concert' | 'sports' | 'convention' | 'festival' | 'holiday' | 'ski' | 'outdoor'
  expectedAttendance: number
  demandIncrease: 'low' | 'moderate' | 'high' | 'extreme'
  description: string
  bookingTip: string
}

interface EventsData {
  events: LocalEvent[]
  marketOutlook: 'slow' | 'steady' | 'busy' | 'peak'
  lastUpdated: string
  region: string
}

const categoryIcons: Record<LocalEvent['category'], typeof Music> = {
  concert: Music,
  sports: Trophy,
  convention: Building2,
  festival: PartyPopper,
  holiday: PartyPopper,
  ski: Snowflake,
  outdoor: Mountain
}

const demandColors: Record<LocalEvent['demandIncrease'], string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  extreme: 'bg-red-500/20 text-red-400 border-red-500/30'
}

const outlookConfig = {
  slow: { label: 'Slow', color: 'bg-slate-500', description: 'Lower than average demand' },
  steady: { label: 'Steady', color: 'bg-green-500', description: 'Normal rental demand' },
  busy: { label: 'Busy', color: 'bg-orange-500', description: 'Above average demand' },
  peak: { label: 'Peak', color: 'bg-red-500', description: 'Maximum demand period' }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAttendance(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

interface UpcomingEventsProps {
  variant?: 'compact' | 'full'
  maxEvents?: number
  showMarketOutlook?: boolean
  className?: string
}

export function UpcomingEvents({ 
  variant = 'full', 
  maxEvents = 6,
  showMarketOutlook = true,
  className = ''
}: UpcomingEventsProps) {
  const [data, setData] = useState<EventsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) throw new Error('Failed to fetch events')
        const eventData = await res.json()
        setData(eventData)
      } catch (err) {
        setError('Unable to load events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvents()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className={`${variant === 'compact' ? 'bg-slate-800/50' : 'bg-slate-900'} border-white/10 ${className}`}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48 bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-700" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  const events = data.events.slice(0, maxEvents)
  const outlook = outlookConfig[data.marketOutlook]

  if (variant === 'compact') {
    return (
      <Card className={`bg-slate-800/50 border-white/10 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-400" />
              Local Events
            </CardTitle>
            {showMarketOutlook && (
              <Badge className={`${outlook.color} text-white text-xs`}>
                {outlook.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => {
              const Icon = categoryIcons[event.category]
              return (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-white font-medium truncate max-w-[140px]">
                        {event.name}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${demandColors[event.demandIncrease]}`}>
                    {event.demandIncrease}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-900 border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-400" />
            Upcoming Events & Rental Demand
          </CardTitle>
          {showMarketOutlook && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={`${outlook.color} text-white flex items-center gap-1`}>
                    <Flame className="h-3 w-3" />
                    Market: {outlook.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{outlook.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-sm text-slate-400">
          Real-time events affecting rental demand in {data.region}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => {
            const Icon = categoryIcons[event.category]
            return (
              <div 
                key={event.id} 
                className="p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-700/50">
                      <Icon className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{event.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.venue}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${demandColors[event.demandIncrease]}`}>
                    {event.demandIncrease}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatAttendance(event.expectedAttendance)}+ expected
                    </span>
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="mt-2 w-full">
                      <div className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300">
                        <Info className="h-3 w-3" />
                        <span>Booking tip</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{event.bookingTip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )
          })}
        </div>
        
        <p className="text-xs text-slate-500 mt-4 text-center">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  )
}
