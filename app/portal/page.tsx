'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FlaskConical, Route, Car, Loader2 } from 'lucide-react'
import Link from 'next/link'

// This page acts as a smart router after login
// It checks the user's role and redirects them to the appropriate portal
// Users can also manually choose which portal to access

export default function PortalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{
    id: string
    email: string
    role: 'host' | 'renter' | 'both' | null
    name: string
  } | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role, has_vehicles')
        .eq('id', authUser.id)
        .single()

      // Determine effective role
      let role: 'host' | 'renter' | 'both' | null = profile?.role || 'renter'
      
      // Check if user has vehicles (they're a host)
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', authUser.id)

      // Check if user has bookings as a renter
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('renter_id', authUser.id)

      if ((vehicleCount || 0) > 0 && (bookingCount || 0) > 0) {
        role = 'both'
      } else if ((vehicleCount || 0) > 0) {
        role = 'host'
      } else {
        role = 'renter'
      }

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role,
        name: profile?.full_name || authUser.email?.split('@')[0] || 'User',
      })

      // Auto-redirect based on role (unless they've been here before)
      const hasVisitedPortal = localStorage.getItem('portal_visited')
      if (!hasVisitedPortal) {
        localStorage.setItem('portal_visited', 'true')
        if (role === 'host') {
          router.push('/hostslab/lobby')
          return
        } else if (role === 'renter') {
          router.push('/rr/lounge')
          return
        }
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#CC0000] animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Welcome, {user?.name}</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Portal Selection */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Portal</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {user?.role === 'both' 
              ? "You're both a host and a renter. Choose which experience you'd like to access."
              : "Select your dashboard to get started."
            }
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Hosts Suite Portal */}
          <Card className="bg-slate-900/50 border-slate-700 hover:border-[#CC0000] transition-all cursor-pointer group">
            <Link href="/hostslab/lobby">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-[#CC0000]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#CC0000]/30 transition-colors">
                  <FlaskConical className="h-10 w-10 text-[#CC0000]" />
                </div>
                <CardTitle className="text-white text-2xl">Hosts Suite</CardTitle>
                <CardDescription className="text-slate-400">
                  Your host command center
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-slate-500 space-y-2 mb-6">
                  <li>Manage your fleet with Eagle GPS tracking</li>
                  <li>View earnings and payouts in The Vault</li>
                  <li>Connect with R&D AI agents</li>
                  <li>Earn XP and badges in The Game Room</li>
                </ul>
                <Button className="w-full bg-[#CC0000] hover:bg-[#AA0000]">
                  Enter Hosts Suite
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Renters Suite Portal */}
          <Card className="bg-slate-900/50 border-slate-700 hover:border-[#CC0000] transition-all cursor-pointer group">
            <Link href="/rr/lounge">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-[#CC0000]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#CC0000]/30 transition-colors">
                  <Route className="h-10 w-10 text-[#CC0000]" />
                </div>
                <CardTitle className="text-white text-2xl">Renters Suite</CardTitle>
                <CardDescription className="text-slate-400">
                  Your renter experience hub
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-slate-500 space-y-2 mb-6">
                  <li>Find and book vehicles in The Garage</li>
                  <li>Track your trips and Road Score</li>
                  <li>Earn rewards and unlock perks</li>
                  <li>Get 24/7 support from our team</li>
                </ul>
                <Button className="w-full bg-[#CC0000] hover:bg-[#AA0000]">
                  Enter Renters Suite
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm mb-4">Or jump directly to:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href="/vehicles">
                <Car className="h-4 w-4 mr-2" />
                Browse Vehicles
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href="/hostslab/workshop">
                My Vehicles
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Link href="/rr/trips">
                My Trips
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
