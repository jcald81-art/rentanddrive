"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut, Car, Home as HomeIcon, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { AuthModal } from '@/components/auth'
import { RADChatDrawer } from '@/components/layout/RADChatDrawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; user_metadata?: { avatar_url?: string; full_name?: string } } | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [radChatOpen, setRadChatOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      <header className="h-16 bg-[#0a0f1e] border-b border-white/10 sticky top-0 z-50">
        <div className="h-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* LEFT: Logo + Ask RAD */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex-shrink-0">
              <Image 
                src="/images/rad-brand-logo.png" 
                alt="Rent and Drive" 
                width={120}
                height={40}
                className="h-8"
                style={{ width: 'auto', height: '32px' }}
                priority
              />
            </Link>
            
            {/* Ask RAD Button */}
            <Button
              onClick={() => setRadChatOpen(true)}
              className="hidden sm:flex bg-[#CC0000] hover:bg-[#AA0000] text-white font-medium px-4 py-2 rounded-md h-9 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Ask RAD
            </Button>
          </div>

          {/* CENTER: Navigation Links (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/vehicles" className="text-sm text-gray-300 hover:text-white transition-colors">
              Browse Vehicles
            </Link>
            <Link href="/how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/list-vehicle" className="text-sm text-gray-300 hover:text-white transition-colors">
              List Your Car
            </Link>
            <Link href="/help" className="text-sm text-gray-300 hover:text-white transition-colors">
              Help
            </Link>
          </nav>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeSwitcher variant="default" className="text-gray-400 hover:text-white" />

            {/* Auth - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          width={28}
                          height={28}
                          className="rounded-full mr-2"
                        />
                      ) : (
                        <User className="h-4 w-4 mr-2" />
                      )}
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                    onClick={() => {
                      setAuthMode('signin')
                      setAuthModalOpen(true)
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-[#2D4A2D] hover:bg-[#3D5A3D] text-white rounded-full px-5"
                    onClick={() => {
                      setAuthMode('signup')
                      setAuthModalOpen(true)
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-[#0a0f1e] border-b border-white/10 py-4 px-4 shadow-xl">
            <nav className="flex flex-col gap-4">
              {/* Ask RAD Button - Mobile */}
              <Button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setRadChatOpen(true)
                }}
                className="w-full bg-[#CC0000] hover:bg-[#AA0000] text-white font-medium py-2 rounded-md gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Ask RAD
              </Button>
              
              <Link 
                href="/vehicles" 
                className="text-sm text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Vehicles
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-sm text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/list-vehicle" 
                className="text-sm text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                List Your Car
              </Link>
              <Link 
                href="/help" 
                className="text-sm text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </Link>

              <div className="border-t border-white/10 pt-4 mt-2">
                {user ? (
                  <>
                    <Link 
                      href="/renter/suite" 
                      className="text-sm text-gray-300 hover:text-white py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Car className="h-4 w-4" /> RAD Renters
                    </Link>
                    <Link 
                      href="/host/dashboard" 
                      className="text-sm text-gray-300 hover:text-white py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <HomeIcon className="h-4 w-4" /> RAD Hosts
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-sm text-gray-300 hover:text-white py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button 
                      className="text-sm text-gray-300 hover:text-white py-2 text-left w-full flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthMode('signin')
                        setAuthModalOpen(true)
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      className="w-full bg-[#2D4A2D] hover:bg-[#3D5A3D] text-white"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAuthMode('signup')
                        setAuthModalOpen(true)
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
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

      {/* RAD Chat Drawer */}
      <RADChatDrawer 
        isOpen={radChatOpen} 
        onClose={() => setRadChatOpen(false)} 
      />
    </>
  )
}
