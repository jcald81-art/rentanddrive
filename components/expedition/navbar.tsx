'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, MessageCircle, User, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth'

export function ExpeditionNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; role?: string } } | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const openConcierge = () => {
    // Dispatch event to open the concierge/RAD AI chat
    window.dispatchEvent(new CustomEvent('open-concierge'))
  }

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-md border-b border-border' 
            : 'bg-transparent'
        )}
      >
        <nav className="mx-auto max-w-[1400px] px-4 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between gap-4">
            
            {/* Left: Logo */}
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="bg-[#1C1F1A] dark:bg-transparent rounded-lg px-2 py-1">
                <Image 
                  src="/images/rad-brand-logo.png" 
                  alt="Rent and Drive" 
                  width={100}
                  height={50}
                  className="h-10 lg:h-12 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Center: Primary Nav Links (Desktop) */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/vehicles"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  pathname === '/vehicles' 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Browse Vehicles
              </Link>
              <Link
                href="/how-it-works"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  pathname === '/how-it-works' 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                How It Works
              </Link>
              <Link
                href="/host/dashboard"
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  pathname?.startsWith('/host') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                RAD Hosts
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              
              {/* Ask RAD Button - Always visible */}
              <Button
                onClick={openConcierge}
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full px-4"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium">Ask RAD</span>
              </Button>

              {/* Mobile Ask RAD - Icon only */}
              <Button
                onClick={openConcierge}
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </Button>

              {/* Theme Switcher */}
              <ThemeSwitcher 
                variant="default" 
                className="hidden md:flex" 
              />

              {/* Go RAD / Become Host CTA */}
              <Link
                href="/list-vehicle"
                className="hidden md:inline-flex text-sm font-medium bg-secondary text-secondary-foreground px-5 py-2 rounded-full hover:bg-secondary/80 transition-all"
              >
                Go RAD
              </Link>

              {/* User Menu or Sign In */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || 'RAD Member'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/renter/suite" className="cursor-pointer">
                        RAD Renters
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/host/dashboard" className="cursor-pointer">
                        RAD Hosts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookings" className="cursor-pointer">
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-5 py-2 rounded-full"
                >
                  Login
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-foreground"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background lg:hidden">
          <div className="flex flex-col h-full pt-20 px-6">
            <nav className="flex flex-col gap-1">
              <Link
                href="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-lg font-medium py-4 border-b border-border transition-colors',
                  pathname === '/vehicles' ? 'text-primary' : 'text-foreground'
                )}
              >
                Browse Vehicles
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-lg font-medium py-4 border-b border-border transition-colors',
                  pathname === '/how-it-works' ? 'text-primary' : 'text-foreground'
                )}
              >
                How It Works
              </Link>
              <Link
                href="/renter/suite"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-lg font-medium py-4 border-b border-border transition-colors',
                  pathname?.startsWith('/renter') ? 'text-primary' : 'text-foreground'
                )}
              >
                RAD Renters
              </Link>
              <Link
                href="/host/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-lg font-medium py-4 border-b border-border transition-colors',
                  pathname?.startsWith('/host') ? 'text-primary' : 'text-foreground'
                )}
              >
                RAD Hosts
              </Link>
            </nav>
            
            <div className="mt-8 flex flex-col gap-4">
              {/* Ask RAD in Mobile */}
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  openConcierge()
                }}
                variant="outline"
                className="w-full py-6 text-lg rounded-full flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                Ask RAD
              </Button>

              {/* Theme Switcher */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <span className="text-lg text-muted-foreground">Theme</span>
                <ThemeSwitcher variant="default" />
              </div>
            </div>
            
            <div className="mt-auto pb-12 flex flex-col gap-4">
              {!user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModalOpen(true)
                  }}
                  className="w-full text-center text-lg font-medium bg-primary text-primary-foreground px-6 py-4 rounded-full"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode="signin"
      />
    </>
  )
}
