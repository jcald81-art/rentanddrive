'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Check, X, MapPin, Calendar, Car, Shield, Phone, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export default function DriveMonthlyPage() {
  const [duration, setDuration] = useState<30 | 60 | 90>(60)
  const [location, setLocation] = useState('')
  const [monthlyOnly, setMonthlyOnly] = useState(true)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load monthly-available vehicles
    const loadVehicles = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/vehicles?monthly_available=true`)
        const data = await res.json()
        setVehicles(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load vehicles:', error)
        setVehicles([])
      }
      setLoading(false)
    }
    loadVehicles()
  }, [])

  const comparisonData = [
    { feature: 'Upfront Cost', lease: '$3,000 - $5,000', ownership: '$5,000 - $20,000+', monthly: '$0' },
    { feature: 'Monthly Payment', lease: '$400 - $800', ownership: '$500 - $1,200', monthly: 'From $899' },
    { feature: 'Flexibility', lease: '36-48 months locked', ownership: 'Stuck with car', monthly: 'Cancel anytime' },
    { feature: 'Maintenance', lease: 'Your responsibility', ownership: 'Your responsibility', monthly: 'Included' },
    { feature: 'Insurance', lease: 'Extra $150+/mo', ownership: 'Extra $150+/mo', monthly: 'Included' },
    { feature: 'Commitment', lease: 'Multi-year contract', ownership: 'Lifetime', monthly: '30 days minimum' },
  ]

  const tiers = [
    {
      name: '30 Days',
      tagline: 'Try it out',
      discount: '2 days free',
      description: 'Standard daily rate × 28 days',
      popular: false,
    },
    {
      name: '60 Days',
      tagline: 'Most Popular',
      discount: '15% off',
      description: '15% off daily rate',
      popular: true,
    },
    {
      name: '90+ Days',
      tagline: 'Best Value',
      discount: '25% off',
      description: '25% off + free Snappr photo shoot on return',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFD84D]/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/30 font-mono">
              {'// NEW — DriveMonthly'}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Skip the Dealership.<br />
              <span className="text-[#FFD84D]">Drive Monthly.</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Book any car for 30, 60, or 90+ days. No down payment. No lease. Cancel anytime.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <p className="text-3xl font-bold font-mono text-[#FFD84D]">57%</p>
                <p className="text-sm text-zinc-400">cheaper than leasing</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <p className="text-3xl font-bold font-mono text-[#FFD84D]">Zero</p>
                <p className="text-sm text-zinc-400">commitment beyond your term</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <p className="text-3xl font-bold font-mono text-[#FFD84D]">Included</p>
                <p className="text-sm text-zinc-400">full insurance coverage</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-black font-semibold px-8"
              onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Monthly Cars
            </Button>
          </div>
        </div>
      </section>

      {/* VS Comparison Table */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why DriveMonthly <span className="text-[#FFD84D]">Wins</span>
          </h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 text-left text-zinc-400 font-normal"></th>
                  <th className="py-4 px-4 text-center text-zinc-400 font-normal">Traditional Lease</th>
                  <th className="py-4 px-4 text-center text-zinc-400 font-normal">Car Ownership</th>
                  <th className="py-4 px-4 text-center">
                    <span className="text-[#FFD84D] font-semibold">DriveMonthly</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    <td className="py-4 px-4 text-zinc-300 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-zinc-500">{row.lease}</td>
                    <td className="py-4 px-4 text-center text-zinc-500">{row.ownership}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-2 text-[#FFD84D]">
                        <Check className="h-4 w-4" />
                        {row.monthly}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Term</h2>
          <p className="text-zinc-400 text-center mb-12">All-inclusive. Insurance, roadside, and delivery available.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier, i) => (
              <Card 
                key={i} 
                className={cn(
                  "bg-zinc-900 border-zinc-800 relative overflow-hidden",
                  tier.popular && "border-2 border-[#FFD84D]"
                )}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-[#FFD84D] text-black text-xs font-semibold px-3 py-1">
                    POPULAR
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{tier.tagline}</p>
                  <div className="bg-[#FFD84D]/10 rounded-lg px-4 py-2 mb-4 inline-block">
                    <span className="text-[#FFD84D] font-mono font-bold">{tier.discount}</span>
                  </div>
                  <p className="text-sm text-zinc-500">{tier.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Search */}
      <section id="search" className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Find Your Monthly Car</h2>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Location */}
                <div className="flex-1">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input
                      placeholder="Reno, Sparks, Lake Tahoe..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* Duration Selector */}
                <div className="flex bg-zinc-800 rounded-lg p-1">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d as 30 | 60 | 90)}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        duration === d 
                          ? "bg-[#FFD84D] text-black" 
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {d} days
                    </button>
                  ))}
                </div>

                {/* Monthly Only Toggle */}
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={monthlyOnly} 
                    onCheckedChange={setMonthlyOnly}
                    className="data-[state=checked]:bg-[#FFD84D]"
                  />
                  <span className="text-sm text-zinc-400">Monthly Only</span>
                </div>

                {/* Search Button */}
                <Button className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-black font-semibold">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {loading ? (
              <div className="col-span-full text-center py-12 text-zinc-500">
                Loading monthly vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              // Show placeholder cards
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-zinc-900 border-zinc-800 overflow-hidden group">
                  <div className="aspect-[16/10] bg-zinc-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="h-12 w-12 text-zinc-700" />
                    </div>
                    <Badge className="absolute top-3 left-3 bg-[#FFD84D] text-black font-mono text-xs">
                      MONTHLY
                    </Badge>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-1">2024 Tesla Model 3</h3>
                    <p className="text-sm text-zinc-500 mb-3">Long Range AWD</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold font-mono text-[#FFD84D]">
                        ${Math.floor(45 * duration * (1 - (duration === 30 ? 0.07 : duration === 60 ? 0.15 : 0.25)))}
                      </span>
                      <span className="text-zinc-500 text-sm">/{duration} days</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        <Shield className="h-3 w-3 mr-1" /> Insured
                      </Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        <Zap className="h-3 w-3 mr-1" /> GPS
                      </Badge>
                    </div>
                    <Link href={`/drivemonthly/vehicle-${i}`}>
                      <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="bg-zinc-900 border-zinc-800 overflow-hidden group">
                  <div className="aspect-[16/10] bg-zinc-800 relative">
                    {vehicle.images?.[0] ? (
                      <Image 
                        src={vehicle.images[0]} 
                        alt={vehicle.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="h-12 w-12 text-zinc-700" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-[#FFD84D] text-black font-mono text-xs">
                      MONTHLY
                    </Badge>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-1">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm text-zinc-500 mb-3">{vehicle.trim || 'Standard'}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold font-mono text-[#FFD84D]">
                        ${Math.floor(vehicle.daily_rate * duration * (1 - (duration === 30 ? 0.07 : duration === 60 ? 0.15 : 0.25)))}
                      </span>
                      <span className="text-zinc-500 text-sm">/{duration} days</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        <Shield className="h-3 w-3 mr-1" /> Insured
                      </Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                        <Zap className="h-3 w-3 mr-1" /> GPS
                      </Badge>
                    </div>
                    <Link href={`/drivemonthly/${vehicle.id}`}>
                      <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 hover:text-white">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Everything Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Shield, label: 'Liability Insurance' },
              { icon: Phone, label: 'Roadside Assistance' },
              { icon: Calendar, label: 'Free Cancellation (72hrs)' },
              { icon: Car, label: '1,500 mi/mo included' },
              { icon: Zap, label: 'Bouncie GPS Monitoring' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFD84D]/10 mb-3">
                  <item.icon className="h-6 w-6 text-[#FFD84D]" />
                </div>
                <p className="text-sm text-zinc-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
