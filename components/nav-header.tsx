'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User, LogOut, Car, Home as HomeIcon, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { AuthModal } from '@/components/auth'
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
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
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
          <div className="bg-[#1C1F1A] dark:bg-transparent rounded-lg px-2 py-1">
            <Image 
              src="/images/rad-brand-logo.png" 
              alt="Rent and Drive - Reno Sparks Lake Tahoe" 
              width={120}
              height={60}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
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

        {/* Theme Switcher & Auth Buttons */}
        {showAuth && (
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher variant="default" className={mutedClass} />
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
                {/* Sign In Button - Opens Modal */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={mutedClass}
                  onClick={() => {
                    setAuthMode('signin')
                    setAuthModalOpen(true)
                  }}
                >
                  Sign In
                </Button>
                {/* Go RAD Button - Opens Modal in signup mode */}
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthModalOpen(true)
                  }}
                >
                  Go RAD
                </Button>
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
            {/* Theme Switcher */}
            <div className="flex items-center justify-between py-2 border-b border-border mb-2">
              <span className={`text-sm ${mutedClass}`}>Theme</span>
              <ThemeSwitcher variant="default" />
            </div>
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
              <Car className="h-4 w-4" /> RAD Renters
            </Link>
            <Link href="/host/dashboard" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
              <HomeIcon className="h-4 w-4" /> RAD Hosts
            </Link>
            <Link href="/help" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            {showAuth && !user && (
              <>
                <button 
                  className={`text-sm ${mutedClass} text-left mt-2`} 
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthMode('signin')
                    setAuthModalOpen(true)
                  }}
                >
                  Sign In
                </button>
                <button 
                  className="w-full text-center text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full mt-2"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthMode('signup')
                    setAuthModalOpen(true)
                  }}
                >
                  Go RAD - Create Account
                </button>
              </>
            )}
            {showAuth && user && (
              <>
                <div className={`text-xs font-semibold uppercase tracking-wider ${mutedClass} mt-2`}>My Dashboards</div>
                <Link href="/renter/suite" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <Car className="h-4 w-4" /> RAD Renters
                </Link>
                <Link href="/host/dashboard" className={`text-sm ${mutedClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                  <HomeIcon className="h-4 w-4" /> RAD Hosts
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode={authMode}
      />
    </header>
  )
}
