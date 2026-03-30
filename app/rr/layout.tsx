'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, Car, Calendar, Gamepad2, User, Bell, Menu, X,
  Map, Trophy, Shield, Gift, Camera, HelpCircle, ShoppingCart,
  Route, FlaskConical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const MOBILE_TABS = [
  { href: '/rr/lounge', icon: Home, label: 'Lounge' },
  { href: '/rr/garage', icon: Car, label: 'Garage' },
  { href: '/rr/trips', icon: Calendar, label: 'Trips' },
  { href: '/rr/gameroom', icon: Gamepad2, label: 'Game' },
  { href: '/rr/profile', icon: User, label: 'Profile' },
]

const FULL_NAV = [
  { href: '/rr/lounge', icon: Home, label: 'The Lounge' },
  { href: '/rr/garage', icon: Car, label: 'The Garage' },
  { href: '/rr/trips', icon: Calendar, label: 'My Trips' },
  { href: '/rr/map', icon: Map, label: 'The Map Room' },
  { href: '/rr/gameroom', icon: Gamepad2, label: 'The Game Room' },
  { href: '/rr/reputation', icon: Trophy, label: 'My Reputation' },
  { href: '/rr/coverage', icon: Shield, label: 'My Coverage' },
  { href: '/rr/rewards', icon: Gift, label: 'The Rewards Desk' },
  { href: '/rr/gallery', icon: Camera, label: 'Trip Gallery' },
  { href: '/rr/support', icon: HelpCircle, label: 'Renter Support' },
  { href: '/rr/car-lot', icon: ShoppingCart, label: 'The Car Lot' },
]

export default function RRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roadScore, setRoadScore] = useState(85)
  const [unreadCount, setUnreadCount] = useState(3)

  useEffect(() => {
    // Fetch road score and notifications
    const fetchData = async () => {
      try {
        const res = await fetch('/api/rr/me')
        if (res.ok) {
          const data = await res.json()
          setRoadScore(data.roadScore || 85)
          setUnreadCount(data.unreadNotifications || 0)
        }
      } catch (e) {
        // Use defaults
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Desktop Top Navigation */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 bg-black/95 backdrop-blur border-b border-slate-800 items-center px-6">
        {/* Logo */}
        <Link href="/rr/lounge" className="flex items-center gap-2 mr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CC0000]">
            <Route className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl">RR</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-1">
          {MOBILE_TABS.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-[#CC0000] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-4">
          {/* Road Score Badge */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#CC0000] to-red-600 flex items-center justify-center">
              <span className="text-xs font-bold">{roadScore}</span>
            </div>
            <span className="text-sm font-medium">Road Score</span>
          </div>

          {/* Notifications */}
          <Link href="/rr/notifications" className="relative p-2 hover:bg-slate-800 rounded-lg">
            <Bell className="h-5 w-5 text-slate-400" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-[#CC0000] text-xs">
                {unreadCount}
              </Badge>
            )}
          </Link>

          {/* Full Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-slate-800 w-80">
              <div className="flex items-center gap-3 mb-8 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]">
                  <Route className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg">Renter&apos;s Road</p>
                  <p className="text-sm text-slate-400">Your adventure awaits</p>
                </div>
              </div>
              <nav className="space-y-1">
                {FULL_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-[#CC0000] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                
                {/* Switch to HostsLab */}
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <Link
                    href="/hostslab/lobby"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <FlaskConical className="h-5 w-5 text-[#CC0000]" />
                    Switch to HostsLab
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Profile */}
          <Link href="/rr/profile" className="p-2 hover:bg-slate-800 rounded-lg">
            <User className="h-5 w-5 text-slate-400" />
          </Link>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-black/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4">
        {/* Logo */}
        <Link href="/rr/lounge" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CC0000]">
            <Route className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold">RR</span>
        </Link>

        {/* Road Score */}
        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-full">
          <div className="h-5 w-5 rounded-full bg-gradient-to-r from-[#CC0000] to-red-600 flex items-center justify-center">
            <span className="text-[10px] font-bold">{roadScore}</span>
          </div>
          <span className="text-xs font-medium">{roadScore}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <Link href="/rr/notifications" className="relative p-2">
            <Bell className="h-5 w-5 text-slate-400" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center bg-[#CC0000] text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-slate-800 w-72">
              <nav className="space-y-1 mt-8">
                {FULL_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-[#CC0000] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 md:pt-16">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-black/95 backdrop-blur border-t border-slate-800 flex items-center justify-around px-2">
        {MOBILE_TABS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                isActive ? 'text-[#CC0000]' : 'text-slate-500'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-[#CC0000]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
