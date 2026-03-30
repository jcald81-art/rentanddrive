'use client'

import { Coins } from 'lucide-react'

type Tier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface DrivePointsBadgeProps {
  points: number
  tier?: Tier
  size?: 'sm' | 'md' | 'lg'
  showTier?: boolean
}

const tierColors = {
  bronze: 'bg-amber-700 border-amber-600',
  silver: 'bg-slate-400 border-slate-300',
  gold: 'bg-yellow-500 border-yellow-400',
  platinum: 'bg-purple-400 border-purple-300',
}

const tierTextColors = {
  bronze: 'text-amber-700',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  platinum: 'text-purple-400',
}

function getTier(points: number): Tier {
  if (points >= 10000) return 'platinum'
  if (points >= 5000) return 'gold'
  if (points >= 1000) return 'silver'
  return 'bronze'
}

export function DrivePointsBadge({ 
  points, 
  tier, 
  size = 'md',
  showTier = true 
}: DrivePointsBadgeProps) {
  const actualTier = tier || getTier(points)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div className={`inline-flex items-center rounded-full bg-zinc-900 border border-zinc-700 ${sizeClasses[size]}`}>
      <Coins className={`${iconSizes[size]} text-[#F59E0B]`} />
      <span className="font-mono text-[#F59E0B] font-semibold">
        {points.toLocaleString()}
      </span>
      {showTier && (
        <span className={`capitalize font-medium ${tierTextColors[actualTier]}`}>
          {actualTier}
        </span>
      )}
    </div>
  )
}
