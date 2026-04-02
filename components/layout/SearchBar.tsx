'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays } from 'date-fns'
import { MapPin, CalendarDays, Search, Car, Menu, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  
  // Search state
  const [location, setLocation] = useState('Reno, NV')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  useEffect(() => {
    setStartDate(addDays(new Date(), 1))
    setEndDate(addDays(new Date(), 4))
    setMounted(true)
    
    // Check auth status
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (startDate) params.set('start_date', format(startDate, 'yyyy-MM-dd'))
    if (endDate) params.set('end_date', format(endDate, 'yyyy-MM-dd'))
    router.push(`/vehicles?${params.toString()}`)
  }

  // Hide on certain pages
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              isScrolled ? 'bg-[#CC0000]' : 'bg-white/20'
            )}>
              <Car className={cn('h-5 w-5', isScrolled ? 'text-white' : 'text-white')} />
            </div>
            <span className={cn(
              'text-lg font-bold transition-colors',
              isScrolled ? 'text-[#0D0D0D]' : 'text-white'
            )}>
              R&D
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Vehicles', href: '/vehicles' },
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Host Your Car', href: '/host' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isScrolled
                    ? 'text-[#0D0D0D]/70 hover:text-[#0D0D0D] hover:bg-[#0D0D0D]/5'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" variant={isScrolled ? 'default' : 'secondary'}>
                <Link href="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isScrolled ? 'text-[#0D0D0D]' : 'text-white hover:bg-white/10'
                  )}
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild size="sm" className="bg-[#CC0000] hover:bg-[#B30000]">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('md:hidden', isScrolled ? 'text-[#0D0D0D]' : 'text-white')}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Sticky Search Bar - Shows when scrolled on desktop */}
        {isScrolled && (
          <div className="hidden md:flex items-center gap-2 pb-3 -mt-1">
            <div className="flex flex-1 items-center gap-2 rounded-full border bg-white px-3 py-1.5 shadow-sm">
              <MapPin className="h-4 w-4 text-[#CC0000]" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="h-7 border-0 bg-transparent text-sm focus-visible:ring-0"
              />
              <div className="h-4 w-px bg-border" />
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm">
                    <CalendarDays className="h-4 w-4 text-[#CC0000]" />
                    <span className="text-muted-foreground">
                      {mounted && startDate ? format(startDate, 'MMM d') : '...'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setStartOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">-</span>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">
                      {mounted && endDate ? format(endDate, 'MMM d') : '...'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      setEndOpen(false)
                    }}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button size="sm" onClick={handleSearch} className="gap-1.5 bg-[#CC0000] hover:bg-[#B30000]">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            {[
              { label: 'Browse Vehicles', href: '/vehicles' },
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Host Your Car', href: '/host' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-[#0D0D0D] font-medium rounded-lg hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-4 mt-2 flex gap-3">
              {user ? (
                <Button asChild className="flex-1">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild className="flex-1 bg-[#CC0000] hover:bg-[#B30000]">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
