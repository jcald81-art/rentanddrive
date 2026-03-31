'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Car, ChevronDown } from 'lucide-react'
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
  const isHostSuite = pathname.startsWith('/host')
  const isRenterSuite = pathname.startsWith('/renter')

  const currentPortal = isHostSuite ? 'host' : isRenterSuite ? 'renter' : null

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
          <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/host/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4 text-[#2D4A2D]" />
              <div>
                <div className="font-medium">RAD Hosts</div>
                <div className="text-xs text-muted-foreground">Host command center</div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/renter/suite" className="flex items-center gap-2">
              <Car className="h-4 w-4 text-[#C4813A]" />
              <div>
                <div className="font-medium">RAD Renters</div>
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
        href={currentPortal === 'host' ? '/renter/suite' : '/host/dashboard'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
      >
        {currentPortal === 'host' ? (
          <>
            <Car className="h-4 w-4 text-[#C4813A]" />
            <span className="hidden sm:inline">Switch to RAD Renters</span>
            <span className="sm:hidden">Renters</span>
          </>
        ) : (
          <>
            <Home className="h-4 w-4 text-[#2D4A2D]" />
            <span className="hidden sm:inline">Switch to RAD Hosts</span>
            <span className="sm:hidden">Hosts</span>
          </>
        )}
      </Link>
    </div>
  )
}
