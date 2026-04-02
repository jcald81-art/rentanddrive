"use client"

// Navbar component for Rent and Drive
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, Car, Home, Settings, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { AuthModal } from '@/components/auth'
import { AskRADButton } from '@/components/shared/AskRADButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [user, setUser] = useState<{ 
    id?: string
    email?: string
    user_metadata?: { avatar_url?: string; full_name?: string } 
  } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [userMode, setUserMode] = useState<'renter' | 'host'>('renter')

  // Load user mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('rad_user_mode') as 'renter' | 'host' | null
    if (savedMode === 'renter' || savedMode === 'host') {
      setUserMode(savedMode)
    }
  }, [])

  // Set user mode and persist to localStorage
  const setMode = (newMode: 'renter' | 'host') => {
    setUserMode(newMode)
    localStorage.setItem('rad_user_mode', newMode)
    // Redirect to appropriate dashboard
    window.location.href = newMode === 'host' ? '/host/dashboard' : '/renter/suite'
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      
      // Fetch user role from profiles
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        
        setUserRole(profile?.role || null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        setUserRole(profile?.role || null)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isPlatformManager = userRole === 'admin' || userRole === 'platform_manager'

  return (
    <>
      <header className="h-16 bg-sidebar border-b border-sidebar-border fixed top-0 left-0 right-0 z-50">
        <div className="h-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* LEFT: Logo + Ask RAD */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/images/rad-brand-logo.png" 
                alt="RAD Rent and Drive" 
                width={120}
                height={40}
                className="h-8"
                style={{ width: 'auto', height: '32px' }}
                priority
              />
            </Link>
            
            {/* Ask RAD Button */}
            <div className="hidden sm:block">
              <AskRADButton />
            </div>
          </div>

          {/* CENTER: Navigation Links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/vehicles" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              Browse Vehicles
            </Link>
            <Link href="/how-it-works" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              How It Works
            </Link>
            <Link 
              href={user ? "/list-vehicle" : "/sign-in?redirectTo=/list-vehicle"} 
              className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            >
              List Your Car
            </Link>
            <Link href="/help" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              Help
            </Link>
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeSwitcher variant="default" className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />

            {/* Auth - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* Segmented Rent/Host Control */}
                  <div className="flex bg-sidebar-foreground/10 rounded-full p-1">
                    <button
                      onClick={() => setMode('renter')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                        userMode === 'renter'
                          ? 'bg-[#FF4D4D] text-white shadow-md'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                      }`}
                    >
                      <Car className="h-3.5 w-3.5" />
                      Rent Vehicles
                    </button>
                    <button
                      onClick={() => setMode('host')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                        userMode === 'host'
                          ? 'bg-[#FF4D4D] text-white shadow-md'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                      }`}
                    >
                      <Home className="h-3.5 w-3.5" />
                      Host Your Car
                    </button>
                  </div>

                  {/* User Avatar Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 rounded-full p-1.5">
                        {user.user_metadata?.avatar_url ? (
                          <Image
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FF4D4D] flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Platform Manager Link - Only visible to admins */}
                      {isPlatformManager && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link 
                              href="/platform-management" 
                              className="flex items-center cursor-pointer text-[#FF4D4D] font-medium"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              RAD Command Center
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  size="sm"
                  className="bg-[#FF4D4D] hover:bg-[#e63939] text-white rounded-full px-6 font-medium shadow-lg shadow-[#FF4D4D]/20 hover:shadow-xl hover:shadow-[#FF4D4D]/30 transition-all"
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthModalOpen(true)
                  }}
                >
                  Get Started
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-sidebar border-b border-sidebar-border py-4 px-4 shadow-xl">
            <nav className="flex flex-col gap-4">
              {/* Ask RAD Button - Mobile */}
              <AskRADButton />
              
              {/* Segmented Control - Mobile */}
              {user && (
                <div className="flex bg-sidebar-foreground/10 rounded-full p-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setMode('renter')
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-all ${
                      userMode === 'renter'
                        ? 'bg-[#FF4D4D] text-white shadow-md'
                        : 'text-sidebar-foreground/70'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    Rent
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setMode('host')
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-full transition-all ${
                      userMode === 'host'
                        ? 'bg-[#FF4D4D] text-white shadow-md'
                        : 'text-sidebar-foreground/70'
                    }`}
                  >
                    <Home className="h-3.5 w-3.5" />
                    Host
                  </button>
                </div>
              )}
              
              <Link 
                href="/vehicles" 
                className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Vehicles
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href={user ? "/list-vehicle" : "/sign-in?redirectTo=/list-vehicle"} 
                className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                List Your Car
              </Link>
              <Link 
                href="/help" 
                className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </Link>

              <div className="border-t border-sidebar-border pt-4 mt-2">
                {user ? (
                  <>
                    {/* Platform Manager - Mobile */}
                    {isPlatformManager && (
                      <Link 
                        href="/platform-management" 
                        className="text-sm font-medium text-[#FF4D4D] hover:text-[#FF4D4D]/80 py-3 px-3 mb-2 flex items-center gap-2 bg-[#FF4D4D]/5 rounded-lg w-full"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4" /> 
                        RAD Command Center
                      </Link>
                    )}
                    <Link 
                      href="/profile" 
                      className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2 block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link 
                      href="/bookings" 
                      className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground py-2 block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <button 
                      className="text-sm text-red-500 hover:text-red-400 py-2 text-left w-full flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-[#FF4D4D] hover:bg-[#e63939] text-white font-medium"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setAuthMode('signup')
                      setAuthModalOpen(true)
                    }}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultMode={authMode}
      />
    </>
  )
}
