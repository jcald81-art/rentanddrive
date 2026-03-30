'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartRateToggleProps {
  vehicleId: string
  currentRate: number
  smartRate?: number
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  compact?: boolean
  className?: string
}

export function SmartRateToggle({
  vehicleId,
  currentRate,
  smartRate,
  enabled = false,
  onToggle,
  compact = false,
  className
}: SmartRateToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [loading, setLoading] = useState(false)

  const calculatedSmartRate = smartRate || Math.round(currentRate * 1.3) // Default 30% increase
  const increase = calculatedSmartRate - currentRate
  const percentIncrease = ((increase / currentRate) * 100).toFixed(0)

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    setIsEnabled(checked)
    
    // Call parent handler if provided
    if (onToggle) {
      onToggle(checked)
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    setLoading(false)
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
          isEnabled 
            ? "bg-[#FFD84D]/10 text-[#FFD84D]" 
            : "bg-zinc-800 text-zinc-500"
        )}>
          <Zap className="h-3 w-3" />
          <span>SmartRate</span>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="data-[state=checked]:bg-[#FFD84D] scale-75"
        />
      </div>
    )
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-colors",
      isEnabled 
        ? "bg-zinc-900 border-[#FFD84D]/30" 
        : "bg-zinc-900/50 border-zinc-800",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            isEnabled ? "bg-[#FFD84D]/10" : "bg-zinc-800"
          )}>
            <Zap className={cn(
              "h-4 w-4 transition-colors",
              isEnabled ? "text-[#FFD84D]" : "text-zinc-500"
            )} />
          </div>
          <div>
            <span className="font-medium text-sm">SmartRate</span>
            {isEnabled && (
              <Badge className="ml-2 bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/20 text-xs">
                Active
              </Badge>
            )}
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="data-[state=checked]:bg-[#FFD84D]"
        />
      </div>

      {isEnabled && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500">Current Rate</p>
            <p className="font-mono text-zinc-400">${currentRate}/day</p>
          </div>
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div className="text-right">
            <p className="text-xs text-zinc-500">SmartRate</p>
            <p className="font-mono text-[#FFD84D]">${calculatedSmartRate}/day</p>
          </div>
        </div>
      )}

      {isEnabled && increase > 0 && (
        <div className="mt-3 p-2 bg-green-500/10 rounded-lg">
          <p className="text-xs text-green-500 text-center">
            +${increase}/day potential increase (+{percentIncrease}%)
          </p>
        </div>
      )}
    </div>
  )
}
