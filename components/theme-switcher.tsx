'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Clean and bright',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
  },
  {
    value: 'rad',
    label: 'RAD',
    icon: Zap,
    description: 'Red and gold premium',
  },
]

interface ThemeSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export function ThemeSwitcher({ variant = 'default', className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Return a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={cn('gap-2', className)} disabled suppressHydrationWarning>
        <Sun className="h-4 w-4" />
        {variant !== 'icon-only' && <span>Theme</span>}
      </Button>
    )
  }

  const currentTheme = themes.find((t) => t.value === (theme === 'system' ? resolvedTheme : theme)) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          suppressHydrationWarning
          className={cn(
            'gap-2 text-sm font-medium transition-colors',
            variant === 'icon-only' && 'px-2',
            theme === 'rad' && 'text-[#CC0000] hover:text-[#D4AF37]',
            className
          )}
        >
          <CurrentIcon className={cn(
            'h-4 w-4',
            theme === 'rad' && 'text-[#CC0000]'
          )} />
          {variant !== 'icon-only' && (
            <>
              <span className="hidden sm:inline">{currentTheme.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.value
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                isActive && 'bg-accent'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                t.value === 'rad' && 'text-[#CC0000]',
                t.value === 'light' && 'text-amber-500',
                t.value === 'dark' && 'text-slate-400'
              )} />
              <div className="flex flex-col">
                <span className={cn(
                  'font-medium',
                  t.value === 'rad' && 'text-[#CC0000]'
                )}>
                  {t.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.description}
                </span>
              </div>
              {isActive && (
                <span className="ml-auto text-xs text-primary">Active</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
