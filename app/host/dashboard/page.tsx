import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UpcomingEvents } from '@/components/upcoming-events'
import { 
  Car as CarIcon, 
  DollarSign, 
  MapPin, 
  Shield, 
  MessageSquare, 
  Gamepad2,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  Users,
  TrendingUp,
  Calendar,
  Star,
  FileText,
  FolderOpen
} from 'lucide-react'
import { MFASecurityBadge } from '@/components/mfa-enrollment'

export default async function HostDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?role=host')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  // Estimated earnings data for Reno market
  const earningsData = [
    { type: 'Economy Car', range: '$400-600/mo' },
    { type: 'SUV with AWD', range: '$800-1,200/mo' },
    { type: 'Truck', range: '$600-900/mo' },
    { type: 'Luxury Vehicle', range: '$1,500-2,500/mo' },
  ]

  // AI Agent features
  const aiAgents = [
    { name: 'RAD Pricing', description: 'AI-optimized dynamic pricing', icon: DollarSign },
    { name: 'RAD Fleet Command', description: 'Real-time GPS fleet tracking', icon: MapPin },
    { name: 'RAD Comms', description: 'Automated guest communications', icon: MessageSquare },
    { name: 'RAD Reputation', description: 'Reputation management AI', icon: Shield },
  ]

  const features = [
    { text: 'AI-optimized dynamic pricing (RAD Pricing)', icon: CheckCircle2 },
    { text: 'Real-time GPS fleet tracking (RAD Fleet Command)', icon: CheckCircle2 },
    { text: 'Automated guest communications (RAD Comms)', icon: CheckCircle2 },
    { text: 'Gamified hosting with XP and levels', icon: CheckCircle2 },
    { text: 'Morning briefs and market intelligence (RAD Intel)', icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-svh bg-[#0a0f1a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0D0D0D]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/images/logo.jpg" 
                alt="Rent and Drive" 
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="text-xs bg-[#D62828] px-2 py-0.5 rounded font-medium text-white">RAD HOSTS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/renter/suite">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
                <CarIcon className="h-4 w-4" />
                RAD Renters
              </Button>
            </Link>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm" type="submit" className="border-white/20 text-white hover:bg-white/10">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="inline-block text-xs font-medium px-3 py-1 bg-[#D62828]/20 text-[#D62828] rounded border border-[#D62828]/30">
                For Vehicle Owners
              </span>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Base Camp
              </h1>
              
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#D62828]">
                  Welcome to RAD Hosts
                </h2>
                <MFASecurityBadge />
              </div>
              
              <p className="text-gray-400 text-lg leading-relaxed">
                Your AI-powered command center. RAD Fleet Command tracking, RAD Pricing AI, RAD Comms automation, and real-time analytics.
              </p>

              {/* Features List */}
              <div className="space-y-3 pt-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#D62828] flex-shrink-0" />
                    <span className="text-gray-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-6">
                <Link href="/host/vehicles/new">
                  <Button className="bg-[#D62828] hover:bg-[#b82222] text-white px-6 py-3 h-auto gap-2">
                    List Your Vehicle — It&apos;s Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link href="/host/ai-agents">
                  <Button variant="ghost" className="text-white/60 hover:text-white px-6 py-3 h-auto">
                    Meet Your RAD Agents
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Earnings Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-[#D62828]/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#D62828]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Estimated Earnings</h3>
                      <p className="text-sm text-gray-500">Based on Reno market</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {earningsData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{item.type}</span>
                        <span className="font-semibold text-gray-900">{item.range}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">$0</p>
              <p className="text-gray-400 text-sm mt-1">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm mt-1">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm mt-1">Pending Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">--</p>
              <p className="text-gray-400 text-sm mt-1">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="border-t border-white/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Your AI Fleet Management Team</h2>
            <p className="text-gray-400">Intelligent agents working 24/7 to maximize your earnings</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiAgents.map((agent, index) => (
              <Card key={index} className="bg-[#151c2c] border-white/10 hover:border-[#D62828]/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#D62828]/20 flex items-center justify-center mx-auto mb-4">
                    <agent.icon className="h-6 w-6 text-[#D62828]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{agent.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events & Market Demand */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <UpcomingEvents variant="full" maxEvents={6} showMarketOutlook={true} />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#D62828]/20 flex items-center justify-center">
                  <CarIcon className="h-5 w-5 text-[#D62828]" />
                </div>
                <h3 className="font-semibold text-white">List a Vehicle</h3>
                <p className="text-sm text-gray-400">Add a new car to your fleet and start earning</p>
                <Button asChild className="w-full bg-[#D62828] hover:bg-[#b82222]">
                  <Link href="/host/vehicles/new">Add Vehicle</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Manage Bookings</h3>
                <p className="text-sm text-gray-400">View and respond to booking requests</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/bookings">View Bookings</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Earnings & Payouts</h3>
                <p className="text-sm text-gray-400">Track your income and manage payouts</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/earnings">View Earnings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">Filing Cabinet</h3>
                <p className="text-sm text-gray-400">Store service records, oil changes, inspections & documents</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/documents">Open Cabinet</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-[#1a237e] to-[#0d47a1] py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to maximize your fleet&apos;s potential?</h2>
          <p className="text-blue-200 mb-6">Join RAD Hosts and let AI handle the heavy lifting</p>
          <Link href="/host/vehicles/new">
            <Button className="bg-white text-[#1a237e] hover:bg-gray-100 px-8 py-3 h-auto font-semibold">
              List Your Vehicle
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
