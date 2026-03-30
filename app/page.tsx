import Link from "next/link"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { getOrganizationSchema, getWebsiteSchema, getLocalBusinessSchema } from '@/lib/structured-data'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Car, 
  Shield, 
  DollarSign, 
  MapPin, 
  Star, 
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Search,
  CalendarDays,
  Zap,
  Mountain,
  Sparkles,
  Download
} from "lucide-react"
import { HeroSearchBar } from "@/components/hero-search-bar"
import { FeaturedVehicles } from "@/components/featured-vehicles"
import { CustomerReviewsCarousel } from "@/components/customer-reviews-carousel"
import { Logo } from "@/components/logo"

export default function HomePage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteSchema()) }}
      />
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessSchema()) }}
      />
      <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="md" />
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/vehicles" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Browse Vehicles
            </Link>
            <Link href="/hostslab/lobby" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              For Hosts
            </Link>
            <Link href="/rr/lounge" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              For Renters
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>

          <Button asChild className="md:hidden">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0D0D0D] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              Save 10% vs Turo - Book Direct
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance md:text-6xl">
              Rent vehicles from{" "}
              <span className="text-primary">local owners</span>{" "}
              in Reno
            </h1>
            <p className="mb-8 text-lg text-gray-400 text-pretty md:text-xl">
              Skip the rental counter. Book cars, SUVs, trucks, and more directly from 
              trusted hosts in your neighborhood. Better prices, better selection, better experience.
            </p>
            
            {/* Turo-style Search Bar */}
            <HeroSearchBar />
            
            <p className="mt-4 text-sm text-gray-500">
              or <Link href="/vehicles" className="text-primary hover:underline">browse all vehicles</Link>
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>$1M Insurance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Instant Book</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Rent and Drive */}
      <section className="border-b py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Why Rent & Drive?
            </h2>
            <p className="text-muted-foreground">
              Your local Reno/Tahoe vehicle rental specialists
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <DollarSign className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Save 10% vs Turo</h3>
                <p className="text-sm text-muted-foreground">
                  Lower platform fees mean better rates for you and higher earnings for hosts.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Mountain className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">AWD Fleet for Tahoe</h3>
                <p className="text-sm text-muted-foreground">
                  We specialize in all-wheel drive vehicles perfect for Sierra winter adventures.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Sparkles className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Free Car Wash Included</h3>
                <p className="text-sm text-muted-foreground">
                  Every rental includes a complimentary Sierra Express car wash - return it clean!
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Smartphone className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Contactless Pickup</h3>
                <p className="text-sm text-muted-foreground">
                  Igloo lockbox pickup - no waiting, no key handoff. Get the code and go.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Shield className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">VIN Verified Vehicles</h3>
                <p className="text-sm text-muted-foreground">
                  Every vehicle passes our verification process. Clean titles, no hidden issues.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Clock className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">24/7 Local Support</h3>
                <p className="text-sm text-muted-foreground">
                  Reno-based team available around the clock. Real humans, real fast response.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Zap className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Eagle GPS Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Every vehicle tracked with Bouncie GPS. Geofencing, trip logs, and instant alerts.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000]/10">
                  <Sparkles className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">AI-Powered Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Smart pricing, automated communications, and intelligent fleet management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <Badge className="mb-4 bg-[#CC0000]/10 text-[#CC0000] border-[#CC0000]/20">
                <Sparkles className="mr-1 h-3 w-3" />
                Top Rated
              </Badge>
              <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Featured Vehicles
              </h2>
              <p className="text-muted-foreground">
                Our highest-rated vehicles ready for your next adventure
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link href="/vehicles">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FeaturedVehicles />
          <Button variant="ghost" asChild className="mt-6 w-full md:hidden">
            <Link href="/vehicles">
              View All Vehicles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Vehicle Categories */}
      <section className="border-t py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
                Browse by category
              </h2>
              <p className="text-muted-foreground">
                Find the perfect vehicle for your next adventure
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link href="/vehicles">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              { 
                name: "Cars", 
                count: 45, 
                href: "/vehicles?category=car",
                image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&auto=format&fit=crop&q=80",
                alt: "Sports car on road"
              },
              { 
                name: "SUVs", 
                count: 32, 
                href: "/vehicles?category=suv",
                image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&auto=format&fit=crop&q=80",
                alt: "Jeep Wrangler SUV"
              },
              { 
                name: "Trucks", 
                count: 18, 
                href: "/vehicles?category=truck",
                image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&auto=format&fit=crop&q=80",
                alt: "Pickup truck"
              },
              { 
                name: "RVs", 
                count: 8, 
                href: "/vehicles?category=rv",
                image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&auto=format&fit=crop&q=80",
                alt: "Camper van in nature"
              },
              { 
                name: "ATVs", 
                count: 12, 
                href: "/vehicles?category=atv",
                image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80",
                alt: "Off-road vehicle"
              },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.alt}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="block text-sm text-white/80">{category.count} available</span>
                </div>
              </Link>
            ))}
          </div>
          <Button variant="ghost" asChild className="mt-6 w-full md:hidden">
            <Link href="/vehicles">
              View All Vehicles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="text-muted-foreground">
              Renting a vehicle has never been easier
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Search",
                description: "Browse vehicles by date, location, and features like AWD or ski racks"
              },
              {
                step: "2",
                title: "Book",
                description: "Reserve instantly or send a request. Add Lyft pickup if needed"
              },
              {
                step: "3",
                title: "Drive",
                description: "Meet your host, inspect the vehicle, and hit the road"
              },
              {
                step: "4",
                title: "Return",
                description: "Drop off the vehicle and leave a review for future renters"
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Carousel */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground">
              Real reviews from renters and hosts in the Reno/Tahoe area
            </p>
          </div>
          <CustomerReviewsCarousel />
        </div>
      </section>

      {/* Download App CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#CC0000] to-[#990000]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center text-white">
            <Download className="h-12 w-12 mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Coming Soon: Mobile App
            </h2>
            <p className="text-white/80 max-w-md mb-6">
              Book vehicles, unlock with your phone, and manage trips on the go. 
              Get notified when we launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" size="lg" disabled>
                <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                App Store
              </Button>
              <Button variant="secondary" size="lg" disabled>
                <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                </svg>
                Google Play
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-[#0D0D0D] py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "500+", label: "Vehicles Listed" },
              { value: "2,000+", label: "Happy Renters" },
              { value: "4.9", label: "Average Rating" },
              { value: "$50K+", label: "Saved vs Turo" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">
              Ready to save on your next rental?
            </h2>
            <p className="mb-6 opacity-90">
              Join Rent & Drive today and get $20 off your first booking
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="border border-white/20 hover:bg-white/10">
                <Link href="/vehicles">Browse Vehicles</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* HostsLab CTA */}
      <section className="border-t py-16 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-white">
              <Badge className="mb-4 bg-[#CC0000]/20 text-[#CC0000] border-[#CC0000]/30">For Vehicle Owners</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Open Your Lab
              </h2>
              <p className="mb-2 text-2xl font-semibold text-[#CC0000]">
                Welcome to HostsLab
              </p>
              <p className="mb-6 text-slate-300">
                Your AI-powered command center for fleet management. Eagle GPS tracking, 
                Dollar pricing AI, Shield reputation management, and real-time analytics.
              </p>
              <ul className="mb-6 space-y-3">
                {[
                  "AI-optimized dynamic pricing (Dollar Agent)",
                  "Real-time GPS fleet tracking (Eagle System)",
                  "Automated guest communications (SecureLink)",
                  "Gamified hosting with XP and levels",
                  "Morning briefs and market intelligence"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-[#CC0000]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000]">
                  <Link href="/hostslab/lobby">
                    Enter HostsLab
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-slate-600 text-white hover:bg-slate-700">
                  <Link href="/signup?role=host">
                    Become a Host
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-primary/10" />
                <Card className="relative">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Estimated Earnings</p>
                        <p className="text-sm text-muted-foreground">Based on Reno market</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Economy Car</span>
                        <span className="font-medium">$400-600/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SUV with AWD</span>
                        <span className="font-medium">$800-1,200/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Truck</span>
                        <span className="font-medium">$600-900/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Luxury Vehicle</span>
                        <span className="font-medium">$1,500-2,500/mo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Renter's Road CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 md:order-1 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-blue-500/10" />
                <Card className="relative bg-slate-800 border-slate-700">
                  <CardContent className="p-6 text-white">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                        <Star className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold">Your Renter Score</p>
                        <p className="text-sm text-slate-400">Earn badges, unlock perks</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Safe Driver Badge</span>
                        <Badge className="bg-green-500/20 text-green-400">Earned</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Road Warrior (10 trips)</span>
                        <Badge className="bg-blue-500/20 text-blue-400">7/10</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Photo Contest Winner</span>
                        <Badge variant="outline" className="text-slate-500">Locked</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">5-Star Renter</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400">4.9</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="order-1 md:order-2 text-white">
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">For Renters</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Find Your Ride
              </h2>
              <p className="mb-2 text-2xl font-semibold text-blue-400">
                Join the Renter&apos;s Road
              </p>
              <p className="mb-6 text-slate-300">
                Earn badges for safe driving, win photo contests, climb the leaderboard, 
                and unlock exclusive discounts. Your journey starts here.
              </p>
              <ul className="mb-6 space-y-3">
                {[
                  "Driving score based on real trip data",
                  "Earn badges: Safe Driver, Road Warrior, Explorer",
                  "Monthly photo contests with prizes",
                  "Unlock discounts with high scores",
                  "Share trip photos and reviews"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/vehicles">
                    Browse Vehicles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-slate-600 text-white hover:bg-slate-700">
                  <Link href="/signup">
                    Create Account
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Car className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Rent & Drive</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Peer-to-peer vehicle rentals in Reno, Nevada. Save 10% vs Turo.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Renters</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/vehicles" className="hover:text-foreground">Browse Vehicles</Link></li>
                <li><Link href="/vehicles?category=suv&awd=true" className="hover:text-foreground">AWD for Tahoe</Link></li>
                <li><Link href="/dashboard/renter" className="hover:text-foreground">Renter&apos;s Road</Link></li>
                <li><Link href="/rewards" className="hover:text-foreground">Social Rewards</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Hosts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/hostslab/lobby" className="hover:text-foreground">HostsLab Dashboard</Link></li>
                <li><Link href="/signup?role=host" className="hover:text-foreground">Become a Host</Link></li>
                <li><Link href="/hostslab/academy" className="hover:text-foreground">Host Academy</Link></li>
                <li><Link href="/hostslab/eagle-command" className="hover:text-foreground">Eagle GPS System</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 Rent and Drive LLC. Reno, Nevada.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>$1M Insurance Coverage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
