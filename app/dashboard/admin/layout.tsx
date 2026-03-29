"use server"

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Car, 
  AlertTriangle,
  Settings,
  CalendarCheck,
  Bot
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const navItems = [
    { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/admin/financials', icon: DollarSign, label: 'Financials' },
    { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
    { href: '/dashboard/admin/vehicles', icon: Car, label: 'Vehicles' },
    { href: '/dashboard/admin/bookings', icon: CalendarCheck, label: 'Bookings' },
    { href: '/dashboard/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
    { href: '/dashboard/admin/agents', icon: Bot, label: 'AI Agents' },
    { href: '/dashboard/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:block">
        <div className="p-6 border-b">
          <Link href="/dashboard/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#CC0000] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R&D</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Rent and Drive</p>
            </div>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
