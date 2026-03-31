'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User, LogOut, Car, Home as HomeIcon, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavHeaderProps {
  variant?: 'light' | 'dark'
  showAuth?: boolean
}

export function NavHeader({ variant = 'light', showAuth = true }: NavHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  
  const isDark = variant === 'dark'
  const bgClass = isDark ? 'bg-[#111111] border-[#222]' : 'bg-background border-border'
  const textClass = isDark ? 'text-white' : 'text-foreground'
  const mutedClass = isDark ? 'text-gray-400 hover:text-white' : 'text-muted-foreground hover:text-foreground'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className={`${bgClass} border-b sticky top-0 z-50`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image 
            src="/images/rad-brand-logo.png" 
            alt="Rent and Drive - Reno Sparks Lake Tahoe" 
            width={120}
            height={60}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/vehicles" className={`text-sm ${mutedClass} transition-colors`}>
            Browse Vehicles
          </Link>
          <Link href="/search" className={`text-sm ${mutedClass} transition-colors`}>
            Search
          </Link>
          <Link href="/renter/suite" className={`text-sm ${mutedClass} transition-colors`}>
            RAD Renters
          </Link>
          <Link href="/host/dashboard" className={`text-sm ${mutedClass} transition-colors`}>
            RAD Hosts
          </Link>
          <Link href="/help" className={`text-sm ${mutedClass} transition-colors`}>
            Help
          </Link>
        </nav>

        {/* Auth Buttons */}
        {showAuth && (
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={mutedClass}>
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/renter/suite" className="flex items-center">
                      <Car className="h-4 w-4 mr-2" />
                      RAD Renters
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/host/dashboard" className="flex items-center">
                      <HomeIcon className="h-4 w-4 mr-2" />
                      RAD Hosts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {/* Sign In Dropdown with Renter/Host options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={mutedClass}>
                      Sign In
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/login?role=renter" className="flex items-center">
                        <Car className="h-4 w-4 mr-2" />
                        As Renter
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/login?role=host" className="flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2" />
                        As Host
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Go RAD Dropdown with Renter/Host options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-[#2D4A2D] hover:bg-[#4A7C59] text-[#F5F2EC] rounded-full px-5">
                      Go RAD
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/signup?role=renter" className="flex items-center">
                        <Car className="h-4 w-4 mr-2" />
                        As Renter
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup?role=host" className="flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2" />
                        As Host
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden ${textClass}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${bgClass} border-t ${isDark ? 'border-[#222]' : 'border-border'} py-4`}>
          <nav className="container mx-auto px-4 flex flex-col gap-4">
            <Link href="/" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/vehicles" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Browse Vehicles
            </Link>
            <Link href="/search" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Search
            </Link>
            <Link href="/renter/suite" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
              <Car className="h-4 w-4" /> Renter Suite
            </Link>
            <Link href="/host/dashboard" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
              <HomeIcon className="h-4 w-4" /> Host Suite
            </Link>
            <Link href="/help" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            {showAuth && !user && (
              <>
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedClass} mt-2`}>Sign In</div>
                <Link href="/login?role=renter" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <Car className="h-4 w-4" /> As Renter
                </Link>
                <Link href="/login?role=host" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <HomeIcon className="h-4 w-4" /> As Host
                </Link>
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedClass} mt-2`}>Sign Up</div>
                <Link href="/signup?role=renter" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <Car className="h-4 w-4" /> As Renter
                </Link>
                <Link href="/signup?role=host" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <HomeIcon className="h-4 w-4" /> As Host
                </Link>
              </>
            )}
            {showAuth && user && (
              <>
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedClass} mt-2`}>My Suites</div>
                <Link href="/renter/suite" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <Car className="h-4 w-4" /> Renter Suite
                </Link>
                <Link href="/host/dashboard" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <HomeIcon className="h-4 w-4" /> Host Suite
                </Link>
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedClass} mt-2`}>Account</div>
                <Link href="/profile" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  My Profile
                </Link>
                <Link href="/bookings" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  My Bookings
                </Link>
                <button className={`text-sm ${mutedClass} text-left`} onClick={handleSignOut}>
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
