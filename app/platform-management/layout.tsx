"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  UserCircle,
  CalendarCheck,
  Radar,
  Zap,
  Gift,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react'

export default async function PlatformManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check platform manager or admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'platform_manager') {
    redirect('/')
  }

  const navItems = [
    { href: '/platform-management', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/platform-management/hosts', icon: Users, label: 'Hosts' },
    { href: '/platform-management/vehicles', icon: Car, label: 'Vehicles' },
    { href: '/platform-management/renters', icon: UserCircle, label: 'Renters' },
    { href: '/platform-management/bookings', icon: CalendarCheck, label: 'Bookings' },
    { href: '/platform-management/radar', icon: Radar, label: 'RADar (Bouncie)' },
    { href: '/platform-management/radev', icon: Zap, label: 'RADev (Tesla)' },
    { href: '/platform-management/referrals', icon: Gift, label: 'Referrals' },
    { href: '/platform-management/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/platform-management/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0f0f0f] hidden md:flex md:flex-col">
        {/* Header with Inspektlabs logo */}
        <div className="p-4 border-b border-white/10">
          <Link href="/platform-management" className="flex items-center gap-3">
            <Image
              src="/images/rad-brand-logo.png"
              alt="RAD Rent and Drive"
              width={120}
              height={40}
              className="h-8"
              style={{ width: 'auto', height: '32px' }}
            />
          </Link>
          <div className="mt-3 px-2 py-1.5 bg-[#FF4D4D]/10 rounded-md">
            <p className="text-[#FF4D4D] text-xs font-medium">RAD Command Center</p>
            <p className="text-white/50 text-xs">Platform Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Link 
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Site
          </Link>
          <div className="mt-3 px-3">
            <p className="text-xs text-white/40">Logged in as</p>
            <p className="text-sm text-white/70 truncate">{profile?.full_name || user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
