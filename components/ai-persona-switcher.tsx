'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Compass, Mountain, Check } from 'lucide-react'
import type { AIPersona } from '@/lib/ai-personas'

interface AIPersonaSwitcherProps {
  currentPersona: AIPersona
  onPersonaChange: (persona: AIPersona) => void
  className?: string
}

export function AIPersonaSwitcher({ currentPersona, onPersonaChange, className }: AIPersonaSwitcherProps) {
  const [selected, setSelected] = useState<AIPersona>(currentPersona)

  const handleSelect = (persona: AIPersona) => {
    setSelected(persona)
    onPersonaChange(persona)
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {/* R&D Card */}
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg relative overflow-hidden',
          selected === 'R&D' 
            ? 'ring-2 ring-[var(--color-forest)] border-[var(--color-forest)]' 
            : 'hover:border-[var(--color-forest)]/50'
        )}
        onClick={() => handleSelect('R&D')}
      >
        {selected === 'R&D' && (
          <div className="absolute top-3 right-3">
            <div className="h-6 w-6 rounded-full bg-[var(--color-forest)] flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--color-forest)] flex items-center justify-center">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                R&D
                <Badge variant="secondary" className="bg-[var(--color-forest)]/10 text-[var(--color-forest)] text-[10px]">
                  BETA ACCESS
                </Badge>
              </CardTitle>
              <CardDescription>Route & Discovery Intelligence</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The cutting-edge choice. Beta features, predictive analytics, and full access to all 10 Expedition agents. Built for hosts who want every edge.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs border-[var(--color-forest)]/30 text-[var(--color-forest)]">
              Beta Access
            </Badge>
            <Badge variant="outline" className="text-xs border-[var(--color-forest)]/30 text-[var(--color-forest)]">
              Full Agent Suite
            </Badge>
            <Badge variant="outline" className="text-xs border-[var(--color-forest)]/30 text-[var(--color-forest)]">
              Advanced Analytics
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* RAD Card */}
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg relative overflow-hidden',
          selected === 'RAD' 
            ? 'ring-2 ring-[var(--color-amber)] border-[var(--color-amber)]' 
            : 'hover:border-[var(--color-amber)]/50'
        )}
        onClick={() => handleSelect('RAD')}
      >
        {selected === 'RAD' && (
          <div className="absolute top-3 right-3">
            <div className="h-6 w-6 rounded-full bg-[var(--color-amber)] flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[var(--color-amber)] flex items-center justify-center">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                RAD
                <Badge variant="secondary" className="bg-[var(--color-amber)]/10 text-[var(--color-amber)] text-[10px]">
                  RECOMMENDED
                </Badge>
              </CardTitle>
              <CardDescription>Rent and Drive — Standard Mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Everything you need, nothing you don&apos;t. Stable features, clean interface, proven performance. The smart choice for everyday fleet management.
          </p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs border-[var(--color-amber)]/30 text-[var(--color-amber)]">
              Stable
            </Badge>
            <Badge variant="outline" className="text-xs border-[var(--color-amber)]/30 text-[var(--color-amber)]">
              Full Features
            </Badge>
            <Badge variant="outline" className="text-xs border-[var(--color-amber)]/30 text-[var(--color-amber)]">
              Recommended
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Compact toggle version for settings pages
export function AIPersonaToggle({ currentPersona, onPersonaChange }: Omit<AIPersonaSwitcherProps, 'className'>) {
  const isRAD = currentPersona === 'RAD'
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
          isRAD 
            ? 'bg-[var(--color-amber)]' 
            : 'bg-[var(--color-forest)]'
        )}>
          {isRAD ? (
            <Mountain className="h-5 w-5 text-white" />
          ) : (
            <Compass className="h-5 w-5 text-white" />
          )}
        </div>
        <div>
          <p className="font-medium">{isRAD ? 'RAD' : 'R&D'}</p>
          <p className="text-xs text-muted-foreground">
            {isRAD ? 'Standard Mode — stable features' : 'Route & Discovery — beta access'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Label htmlFor="persona-toggle" className="text-sm text-muted-foreground">
          {isRAD ? 'RAD' : 'R&D'}
        </Label>
        <Switch
          id="persona-toggle"
          checked={!isRAD}
          onCheckedChange={(checked) => onPersonaChange(checked ? 'R&D' : 'RAD')}
          className="data-[state=checked]:bg-[var(--color-forest)] data-[state=unchecked]:bg-[var(--color-amber)]"
        />
      </div>
    </div>
  )
}
