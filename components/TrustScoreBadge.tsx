'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, Minus, CheckCircle2 } from 'lucide-react'

interface TrustScoreBadgeProps {
  score: number
  size?: 'sm' | 'lg'
  breakdown?: {
    idVerified: boolean
    noIncidents: boolean
    completedRentals: number
    accountAgeDays: number
    avgRating: number
    profileComplete: boolean
  }
  showBreakdown?: boolean
}

export function TrustScoreBadge({ score, size = 'sm', breakdown, showBreakdown = false }: TrustScoreBadgeProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getScoreColor = (s: number) => {
    if (s <= 40) return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/30', bar: 'bg-red-500' }
    if (s <= 70) return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/30', bar: 'bg-yellow-500' }
    return { bg: 'bg-green-500/20', text: 'text-green-500', border: 'border-green-500/30', bar: 'bg-green-500' }
  }

  const getIcon = (s: number) => {
    if (s <= 40) return <AlertTriangle className="h-4 w-4" />
    if (s <= 70) return <Minus className="h-4 w-4" />
    return <CheckCircle2 className="h-4 w-4" />
  }

  const colors = getScoreColor(score)

  if (size === 'sm') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
        colors.bg, colors.text, 'border', colors.border
      )}>
        {getIcon(score)}
        <span className="font-mono">{score}</span>
      </div>
    )
  }

  // Large size with optional breakdown
  const breakdownItems = breakdown ? [
    { label: 'ID Verified', value: breakdown.idVerified, points: breakdown.idVerified ? 25 : 0, max: 25 },
    { label: 'No Incidents', value: breakdown.noIncidents, points: breakdown.noIncidents ? 20 : 0, max: 20 },
    { label: 'Completed Rentals', value: breakdown.completedRentals, points: Math.min(breakdown.completedRentals * 5, 15), max: 15 },
    { label: 'Account Age', value: `${breakdown.accountAgeDays} days`, points: Math.min(Math.floor(breakdown.accountAgeDays / 3), 10), max: 10 },
    { label: 'Rating', value: breakdown.avgRating.toFixed(1), points: Math.min(Math.floor((breakdown.avgRating - 3) * 10), 20), max: 20 },
    { label: 'Profile Complete', value: breakdown.profileComplete, points: breakdown.profileComplete ? 10 : 0, max: 10 },
  ] : []

  return (
    <div className="space-y-4">
      <div className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        colors.bg, 'border', colors.border
      )}>
        <div className={cn('p-2 rounded-full', colors.bg)}>
          {getIcon(score)}
        </div>
        <div>
          <p className="text-sm text-zinc-400">Trust Score</p>
          <p className={cn('text-3xl font-mono font-bold', colors.text)}>{score}</p>
        </div>
        <div className="ml-auto">
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={cn('h-full rounded-full transition-all duration-1000 ease-out', colors.bar)}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
        </div>
      </div>

      {showBreakdown && breakdown && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-400">Score Breakdown</p>
          {breakdownItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {typeof item.value === 'boolean' ? (
                  item.value ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <span className="text-zinc-300">{item.label}</span>
                {typeof item.value !== 'boolean' && (
                  <span className="text-zinc-500">({item.value})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(item.points / item.max) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-green-500">+{item.points}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <span className="font-medium">Total</span>
            <span className={cn('font-mono font-bold', colors.text)}>{score}/100</span>
          </div>
        </div>
      )}
    </div>
  )
}
