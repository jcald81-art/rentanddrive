import Link from "next/link"
import { Button } from "@/components/ui/button"
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
  CalendarDays
} from "lucide-react"
import { HeroSearchBar } from "@/components/hero-search-bar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Rent</span>
              <span className="text-foreground">&</span>
              <span className="text-foreground">Drive</span>
            </span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/vehicles" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Browse Vehicles
            </Link>
            <Link href="/host/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              List Your Car
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

      {/* Value Props */}
      <section className="border-b py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Why book with Rent & Drive?
            </h2>
            <p className="text-muted-foreground">
              We connect you directly with vehicle owners, cutting out the middleman 
              and passing the savings to you.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Save 10% vs Turo</h3>
                <p className="text-sm text-muted-foreground">
                  Lower platform fees mean better rates for renters and higher earnings 
                  for hosts. Everyone wins.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Local Selection</h3>
                <p className="text-sm text-muted-foreground">
                  Cars, SUVs, trucks, ATVs, and RVs from Reno locals. Perfect for 
                  ski trips, Lake Tahoe adventures, or everyday use.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Lyft Pickup Available</h3>
                <p className="text-sm text-muted-foreground">
                  Add Lyft pickup/dropoff to your booking. We will get you to and from 
                  the vehicle location hassle-free.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vehicle Categories */}
      <section className="py-16 md:py-24">
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
                image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&auto=format&fit=crop",
                alt: "Tesla Model Y electric car"
              },
              { 
                name: "SUVs", 
                count: 32, 
                href: "/vehicles?category=suv",
                image: "https://images.unsplash.com/photo-1626443252351-4f3a387d6d68?w=400&auto=format&fit=crop&q=80",
                alt: "Subaru Outback Wilderness SUV"
              },
              { 
                name: "Trucks", 
                count: 18, 
                href: "/vehicles?category=truck",
                image: "https://images.unsplash.com/photo-1590739225287-bd31519780c3?w=400&auto=format&fit=crop",
                alt: "Ford F-150 Raptor truck"
              },
              { 
                name: "RVs", 
                count: 8, 
                href: "/vehicles?category=rv",
                image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&auto=format&fit=crop",
                alt: "Winnebago camper van"
              },
              { 
                name: "ATVs", 
                count: 12, 
                href: "/vehicles?category=atv",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop",
                alt: "Polaris RZR side-by-side"
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

      {/* Social Proof */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Trusted by locals
            </h2>
            <p className="text-muted-foreground">
              Join hundreds of renters and hosts in the Reno area
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sarah M.",
                role: "Renter",
                rating: 5,
                text: "Saved $80 compared to Turo on my ski weekend rental. The Subaru had snow tires and was perfect for Tahoe."
              },
              {
                name: "Mike T.",
                role: "Host",
                rating: 5,
                text: "My truck earns me $800/month when I am not using it. The platform is super easy and payouts are fast."
              },
              {
                name: "Jessica L.",
                role: "Renter",
                rating: 5,
                text: "The Lyft pickup feature is a game changer. Got picked up at the airport and dropped at the car. So convenient!"
              }
            ].map((review, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">{`"${review.text}"`}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-medium">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

      {/* Host CTA */}
      <section className="border-t py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">For Vehicle Owners</Badge>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Turn your car into a money maker
              </h2>
              <p className="mb-6 text-muted-foreground">
                List your vehicle on Rent & Drive and earn money when you are not using it. 
                We handle insurance, payments, and 24/7 support.
              </p>
              <ul className="mb-6 space-y-3">
                {[
                  "Earn up to $1,000/month per vehicle",
                  "$1M liability insurance included",
                  "You set the price and availability",
                  "Get paid within 3 days of each trip"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/signup?role=host">
                  Start Hosting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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
                <li><Link href="/vehicles?category=suv&awd=true" className="hover:text-foreground">AWD Vehicles</Link></li>
                <li><Link href="/vehicles?category=rv" className="hover:text-foreground">RVs & Campers</Link></li>
                <li><Link href="/signup" className="hover:text-foreground">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Hosts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup?role=host" className="hover:text-foreground">List Your Vehicle</Link></li>
                <li><Link href="/host/dashboard" className="hover:text-foreground">Host Dashboard</Link></li>
                <li><Link href="#" className="hover:text-foreground">Insurance Info</Link></li>
                <li><Link href="#" className="hover:text-foreground">Host Resources</Link></li>
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
              © 2024 Rent and Drive LLC. Reno, Nevada.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>$1M Insurance Coverage</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
