'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FlaskConical, Route, ArrowLeftRight, Car, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PortalSwitcherProps {
  className?: string
  variant?: 'default' | 'compact'
}

export function PortalSwitcher({ className, variant = 'default' }: PortalSwitcherProps) {
  const pathname = usePathname()
  const isHostsLab = pathname.startsWith('/hostslab')
  const isRR = pathname.startsWith('/rr')

  const currentPortal = isHostsLab ? 'hostslab' : isRR ? 'rr' : null

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("gap-2", className)}>
            <ArrowLeftRight className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch Portal</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/hostslab/lobby" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#CC0000]" />
              <div>
                <div className="font-medium">HostsLab</div>
                <div className="text-xs text-muted-foreground">Host command center</div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/rr/lounge" className="flex items-center gap-2">
              <Route className="h-4 w-4 text-[#CC0000]" />
              <div>
                <div className="font-medium">Renter&apos;s Road</div>
                <div className="text-xs text-muted-foreground">Renter experience</div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Browse Vehicles
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link
        href={currentPortal === 'hostslab' ? '/rr/lounge' : '/hostslab/lobby'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
      >
        {currentPortal === 'hostslab' ? (
          <>
            <Route className="h-4 w-4 text-[#CC0000]" />
            <span className="hidden sm:inline">Switch to Renter&apos;s Road</span>
            <span className="sm:hidden">RR</span>
          </>
        ) : (
          <>
            <FlaskConical className="h-4 w-4 text-[#CC0000]" />
            <span className="hidden sm:inline">Switch to HostsLab</span>
            <span className="sm:hidden">HostsLab</span>
          </>
        )}
      </Link>
    </div>
  )
}
