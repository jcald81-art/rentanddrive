import Link from 'next/link'
import { MapPin } from 'lucide-react'

const markets = [
  {
    name: 'Reno',
    description: 'Downtown, Airport (RNO), Midtown',
    vehicles: '200+',
    image: 'https://images.unsplash.com/photo-1571993143074-abed4f26ffe7?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sparks',
    description: 'Victorian Square, Legends',
    vehicles: '80+',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Lake Tahoe',
    description: 'Incline Village, South Lake',
    vehicles: '150+',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Carson City',
    description: 'State Capital, Eagle Valley',
    vehicles: '50+',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop&q=80',
  },
]

export function MarketsSection() {
  return (
    <section className="bg-[#F5F3EF] py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-[#0D0D0D] md:text-4xl">
            Serving Northern Nevada
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Vehicles available throughout the Reno-Tahoe region. Pick up where it&apos;s convenient for you.
          </p>
        </div>

        {/* Markets Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {markets.map((market) => (
            <Link
              key={market.name}
              href={`/vehicles?location=${market.name.toLowerCase().replace(' ', '-')}`}
              className="group relative overflow-hidden rounded-xl"
            >
              {/* Background Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={market.image}
                  alt={market.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-1.5 text-white/80 mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">{market.vehicles} vehicles</span>
                </div>
                <h3 className="text-xl font-bold text-white">{market.name}</h3>
                <p className="text-sm text-white/70">{market.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
