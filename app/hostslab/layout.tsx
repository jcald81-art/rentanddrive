'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  FlaskConical,
  Home,
  Wrench,
  Radar,
  Compass,
  FileText,
  Vault,
  FolderArchive,
  Gamepad2,
  Coffee,
  GraduationCap,
  Settings,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/hostslab/lobby', label: 'The Lobby', icon: Home },
  { href: '/hostslab/workshop', label: 'The Workshop', icon: Wrench },
  { href: '/hostslab/eagle-command', label: 'Eagle Command Center', icon: Radar },
  { href: '/hostslab/rd-navigator', label: 'R&D Navigator', icon: Compass },
  { href: '/hostslab/briefing-room', label: 'The Briefing Room', icon: FileText },
  { href: '/hostslab/vault', label: 'The Vault', icon: Vault },
  { href: '/hostslab/filing-cabinet', label: 'The Filing Cabinet', icon: FolderArchive },
  { href: '/hostslab/game-room', label: 'The Game Room', icon: Gamepad2 },
  { href: '/hostslab/break-room', label: 'The Break Room', icon: Coffee },
  { href: '/hostslab/academy', label: 'The Academy', icon: GraduationCap },
  { href: '/hostslab/lab-controls', label: 'Lab Controls', icon: Settings },
]

const LAB_LEVELS = [
  { level: 1, name: 'Rookie', minXp: 0, color: 'bg-slate-500' },
  { level: 2, name: 'Apprentice', minXp: 500, color: 'bg-green-500' },
  { level: 3, name: 'Pro', minXp: 2000, color: 'bg-blue-500' },
  { level: 4, name: 'Expert', minXp: 5000, color: 'bg-purple-500' },
  { level: 5, name: 'Elite', minXp: 10000, color: 'bg-amber-500' },
  { level: 6, name: 'Legend', minXp: 25000, color: 'bg-[#CC0000]' },
]

interface HostData {
  id: string
  full_name: string
  avatar_url: string | null
  lab_level: number
  lab_xp: number
  active_alerts: number
  is_admin?: boolean
}

function getLabLevel(xp: number) {
  for (let i = LAB_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LAB_LEVELS[i].minXp) return LAB_LEVELS[i]
  }
  return LAB_LEVELS[0]
}

function Sidebar({ 
  collapsed, 
  setCollapsed, 
  host, 
  alertCount 
}: { 
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  host: HostData | null
  alertCount: number
}) {
  const pathname = usePathname()
  const labLevel = host ? getLabLevel(host.lab_xp || 0) : LAB_LEVELS[0]

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700">
        <div className="flex-shrink-0 w-10 h-10 bg-[#CC0000] rounded-lg flex items-center justify-center">
          <FlaskConical className="h-6 w-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg">HostsLab</h1>
            <p className="text-xs text-slate-400">Command Center</p>
          </div>
        )}
      </div>

      {/* Host Profile */}
      {host && (
        <div className={cn(
          "p-4 border-b border-slate-700",
          collapsed ? "flex justify-center" : ""
        )}>
          {collapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-10 w-10 border-2 border-slate-600">
                    <AvatarImage src={host.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-700">
                      {host.full_name?.charAt(0) || 'H'}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{host.full_name}</p>
                  <p className="text-xs text-muted-foreground">{labLevel.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-slate-600">
                <AvatarImage src={host.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-700">
                  {host.full_name?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{host.full_name}</p>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", labLevel.color)}>
                    Lv.{labLevel.level}
                  </Badge>
                  <span className="text-xs text-slate-400">{labLevel.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <TooltipProvider>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            
            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center h-12 mx-2 my-1 rounded-lg transition-colors",
                      isActive 
                        ? "bg-[#CC0000] text-white" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#CC0000] text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.href === '/hostslab/eagle-command' && alertCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {alertCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </TooltipProvider>
      </nav>

      {/* Alerts & Collapse */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed && alertCount > 0 && (
          <Link 
            href="/hostslab/eagle-command"
            className="flex items-center gap-2 p-3 mb-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="text-sm">{alertCount} Active Alert{alertCount !== 1 ? 's' : ''}</span>
          </Link>
        )}
        
        {host?.is_admin && !collapsed && (
          <Link 
            href="/hostslab/admin-override"
            className="flex items-center gap-2 p-3 mb-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm">Admin Override</span>
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}

function MobileNav({ host, alertCount }: { host: HostData | null; alertCount: number }) {
  const pathname = usePathname()
  const labLevel = host ? getLabLevel(host.lab_xp || 0) : LAB_LEVELS[0]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-slate-900 text-white border-slate-700">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-10 h-10 bg-[#CC0000] rounded-lg flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">HostsLab</h1>
            <p className="text-xs text-slate-400">Command Center</p>
          </div>
        </div>

        {/* Host Profile */}
        {host && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-slate-600">
                <AvatarImage src={host.avatar_url || undefined} />
                <AvatarFallback className="bg-slate-700">
                  {host.full_name?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{host.full_name}</p>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", labLevel.color)}>
                    Lv.{labLevel.level}
                  </Badge>
                  <span className="text-xs text-slate-400">{labLevel.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#CC0000] text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.href === '/hostslab/eagle-command' && alertCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {alertCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export default function HostsLabLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [host, setHost] = useState<HostData | null>(null)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    // Fetch host data
    fetch('/api/hostslab/me')
      .then(res => res.json())
      .then(data => {
        if (data.host) setHost(data.host)
        if (data.alertCount) setAlertCount(data.alertCount)
      })
      .catch(console.error)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          host={host}
          alertCount={alertCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b">
          <MobileNav host={host} alertCount={alertCount} />
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-[#CC0000]" />
            <span className="font-bold">HostsLab</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
