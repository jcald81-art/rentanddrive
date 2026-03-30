'use client'

import Link from 'next/link'
import { Car, Menu, X, User, LogOut } from 'lucide-react'
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
        <Link href="/" className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${textClass}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CC0000]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Rent & Drive</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/vehicles" className={`text-sm ${mutedClass} transition-colors`}>
            Browse Vehicles
          </Link>
          <Link href="/search" className={`text-sm ${mutedClass} transition-colors`}>
            Search
          </Link>
          <Link href="/host" className={`text-sm ${mutedClass} transition-colors`}>
            List Your Car
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">My Bookings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
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
                <Link href="/login">
                  <Button variant="ghost" size="sm" className={mutedClass}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#CC0000] hover:bg-[#aa0000] text-white">
                    Sign Up
                  </Button>
                </Link>
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
            <Link href="/host" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              List Your Car
            </Link>
            <Link href="/help" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            {showAuth && !user && (
              <>
                <Link href="/login" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
            {showAuth && user && (
              <>
                <Link href="/profile" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  My Profile
                </Link>
                <Link href="/bookings" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  My Bookings
                </Link>
                <Link href="/dashboard" className={`text-sm ${mutedClass}`} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
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
