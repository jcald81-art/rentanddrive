'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Beaker, Waves, Check, Sparkles, Shield } from 'lucide-react'
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
            ? 'ring-2 ring-[#D62828] border-[#D62828]' 
            : 'hover:border-[#D62828]/50'
        )}
        onClick={() => handleSelect('R&D')}
      >
        {selected === 'R&D' && (
          <div className="absolute top-3 right-3">
            <div className="h-6 w-6 rounded-full bg-[#D62828] flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D62828] to-[#A31D1D] flex items-center justify-center">
              <Beaker className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                R&D
                <Badge variant="secondary" className="bg-[#D62828]/10 text-[#D62828] text-[10px]">
                  BETA ACCESS
                </Badge>
              </CardTitle>
              <CardDescription>Rent & Drive Intelligence</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your cutting-edge AI assistant. Get early access to new features and help shape the future of Rent and Drive.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#D62828]" />
              <span>Beta feature access</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#D62828]" />
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#D62828]" />
              <span>Predictive insights</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#D62828]" />
              <span>Experimental AI tools</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#D62828]/5 border border-[#D62828]/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-[#D62828]">Note:</span> Beta features may change or have bugs. Your feedback helps us improve!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RAD Card */}
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg relative overflow-hidden',
          selected === 'RAD' 
            ? 'ring-2 ring-[#00B4D8] border-[#00B4D8]' 
            : 'hover:border-[#00B4D8]/50'
        )}
        onClick={() => handleSelect('RAD')}
      >
        {selected === 'RAD' && (
          <div className="absolute top-3 right-3">
            <div className="h-6 w-6 rounded-full bg-[#00B4D8] flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                RAD
                <Badge variant="secondary" className="bg-[#00B4D8]/10 text-[#00B4D8] text-[10px]">
                  STABLE
                </Badge>
              </CardTitle>
              <CardDescription>Ride And Drive, Dude!</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your chill AI buddy. Production-tested features only - no surprises, just good vibes and smooth sailing.
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#00B4D8]" />
              <span>Stable features only</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#00B4D8]" />
              <span>Proven reliability</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#00B4D8]" />
              <span>Smooth experience</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#00B4D8]" />
              <span>Good vibes guaranteed</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#00B4D8]/5 border border-[#00B4D8]/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-[#00B4D8]">Motto:</span> Hang 10 and drive 55! 🤙
            </p>
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
            ? 'bg-gradient-to-br from-[#00B4D8] to-[#0077B6]' 
            : 'bg-gradient-to-br from-[#D62828] to-[#A31D1D]'
        )}>
          {isRAD ? (
            <Waves className="h-5 w-5 text-white" />
          ) : (
            <Beaker className="h-5 w-5 text-white" />
          )}
        </div>
        <div>
          <p className="font-medium">{isRAD ? 'RAD' : 'R&D'}</p>
          <p className="text-xs text-muted-foreground">
            {isRAD ? 'Chill mode - stable features' : 'Beta mode - cutting edge'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Label htmlFor="persona-toggle" className="text-sm text-muted-foreground">
          {isRAD ? '🏄 RAD' : '🔬 R&D'}
        </Label>
        <Switch
          id="persona-toggle"
          checked={!isRAD}
          onCheckedChange={(checked) => onPersonaChange(checked ? 'R&D' : 'RAD')}
          className="data-[state=checked]:bg-[#D62828] data-[state=unchecked]:bg-[#00B4D8]"
        />
      </div>
    </div>
  )
}
