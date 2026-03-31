'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, ChevronDown, HelpCircle, Sun, Moon, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'

const NAV_LINKS = [
  { href: '/vehicles', label: 'Browse Vehicles' },
  { href: '/search', label: 'Search' },
  { href: '/vehicles', label: 'RAD Renters' },
  { href: '/host/dashboard', label: 'RAD Hosts' },
  { href: '/help', label: 'Help' },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string; avatar_url?: string } } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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

  const handleProtectedLink = (href: string) => {
    if (href === '/host/dashboard' && !user) {
      const redirectUrl = href
      router.push(`/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`)
      return
    }
    router.push(href)
    setMobileMenuOpen(false)
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('rad')
    else setTheme('light')
  }

  const ThemeIcon = theme === 'rad' ? Zap : theme === 'dark' ? Moon : Sun

  return (
    <>
      <header
        className={cn(
          'sticky top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-background/95 backdrop-blur-md border-b border-border' 
            : 'bg-background border-b border-border/50',
          theme === 'rad' && 'border-b-[rgba(244,167,34,0.2)]'
        )}
      >
        <nav className="w-full max-w-[1280px] mx-auto px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Left: Logo */}
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <Image 
                src="/images/rad-brand-logo.png" 
                alt="Rent and Drive" 
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Center: Primary Nav Links (Desktop) */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleProtectedLink(link.href)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                    pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              
              {/* Theme Toggle */}
              <Button
                onClick={cycleTheme}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                title={`Current: ${theme}. Click to switch.`}
              >
                <ThemeIcon className={cn('h-5 w-5', theme === 'rad' && 'text-[#F4A722]')} />
              </Button>

              {/* User Menu or Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full px-3">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {user.user_metadata?.full_name || 'Account'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || 'RAD Member'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/vehicles" className="cursor-pointer">
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
                <Button
                  onClick={() => {
                    const redirectUrl = pathname || '/'
                    router.push(`/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`)
                  }}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 rounded-full"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block">Account</span>
                </Button>
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
        <div className="fixed inset-0 z-40 bg-background lg:hidden pt-16">
          <div className="flex flex-col h-full px-6 py-4 overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleProtectedLink(link.href)}
                  className={cn(
                    'text-left text-lg font-medium py-4 border-b border-border transition-colors',
                    pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
                      ? 'text-primary' 
                      : 'text-foreground'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>
            
            <div className="mt-8 flex flex-col gap-4">
              {/* Theme Switcher */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <span className="text-lg text-muted-foreground">Theme</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setTheme('light')}
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setTheme('dark')}
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setTheme('rad')}
                    variant={theme === 'rad' ? 'default' : 'outline'}
                    size="sm"
                    className={theme === 'rad' ? 'bg-[#e63946]' : ''}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pb-12 flex flex-col gap-4">
              {!user && (
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    const redirectUrl = pathname || '/'
                    router.push(`/auth/signin?redirect=${encodeURIComponent(redirectUrl)}`)
                  }}
                  className="w-full py-6 text-lg rounded-full"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
