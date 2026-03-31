import { Metadata } from 'next'
import Link from 'next/link'
import { ExpeditionFooter } from '@/components/expedition/footer'
import { 
  Search, 
  Calendar, 
  Key, 
  Car, 
  Shield, 
  Users, 
  Smartphone,
  MapPin,
  Home,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'How It Works | RAD - Rent and Drive',
  description: 'Learn how RAD makes peer-to-peer vehicle rentals simple, safe, and seamless with integrated Uber and Lyft mobility services.',
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 block">
            The RAD Way
          </span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 text-balance">
            Adventure, simplified.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Book unique adventure vehicles from local hosts. We handle the logistics 
            with integrated Uber and Lyft — you handle the adventure.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Search,
                step: '01',
                title: 'Find your ride',
                description: 'Browse adventure-ready vehicles from local hosts. Filter by type, features, and availability.',
              },
              {
                icon: Calendar,
                step: '02',
                title: 'Book instantly',
                description: 'Select your dates, add optional RAD Mobility services, and confirm with secure payment.',
              },
              {
                icon: Key,
                step: '03',
                title: 'Pick up or get delivered',
                description: 'Get a free Lyft to your vehicle, or have it delivered directly to you via Uber Direct.',
              },
              {
                icon: Car,
                step: '04',
                title: 'Hit the road',
                description: 'Explore Northern Nevada and the Sierra. When you return, we book your Lyft home.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-primary mb-1 block">{item.step}</span>
                    <h3 className="text-lg font-medium text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAD Mobility Section */}
      <section className="py-20 px-6 bg-card">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3 block">
              Industry first
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              We handle the logistics.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              No other P2PCR platform on earth integrates Uber and Lyft
              into the booking experience. RAD does.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                provider: 'Lyft',
                color: '#FF00BF',
                icon: Car,
                title: 'Free Lyft to your vehicle',
                body: 'Book your RAD vehicle and we dispatch a Lyft to your location automatically. No Lyft account needed. Arrives 30 minutes before your trip starts.',
              },
              {
                provider: 'Uber Direct',
                color: '#000000',
                icon: MapPin,
                title: 'Vehicle delivered to you',
                body: 'Stay where you are. An Uber driver picks up your RAD vehicle and delivers it directly to your hotel, home, or airport. The only P2PCR platform to offer this.',
              },
              {
                provider: 'Lyft',
                color: '#FF00BF',
                icon: Home,
                title: 'Lyft home after return',
                body: 'Drop the keys in the Keybox, walk out, and your Lyft home is already booked and waiting. Trip complete. Zero coordination.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="bg-muted/30 border border-border rounded-xl p-6 hover:border-border/80 transition-colors"
              >
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg mb-4"
                  style={{ background: item.color, color: 'white' }}
                >
                  {item.provider}
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-foreground mb-2">
                  Free rides. Really.
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lyft rides to and from your RAD vehicle are complimentary with every booking. 
                  No catch, no surge pricing, no Lyft account required. We use your phone number to dispatch the ride automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Included with every booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Pillars Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
              Built on trust.
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every RAD booking is backed by verification, insurance, and 24/7 support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Comprehensive insurance',
                description: 'Every trip includes liability and collision coverage. Drive with confidence.',
              },
              {
                icon: Users,
                title: 'Verified hosts & renters',
                description: 'Identity verification, driving record checks, and reviews you can trust.',
              },
              {
                icon: Smartphone,
                title: '24/7 RAD Support',
                description: 'Our Beacon AI + human team is always available. Text, call, or chat anytime.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-xl bg-muted/30 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-card">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Ready to go RAD?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse adventure-ready vehicles in Reno, Sparks, and Lake Tahoe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/vehicles">
                Browse Vehicles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
              <Link href="/host">
                List Your Vehicle
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ExpeditionFooter />
    </div>
  )
}
