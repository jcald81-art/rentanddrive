import Image from 'next/image'
import Link from 'next/link'

const MARKETS = [
  {
    name: 'Reno',
    tagline: 'Desert meets mountains',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
    href: '/vehicles?location=reno',
  },
  {
    name: 'Lake Tahoe',
    tagline: 'Alpine adventures',
    image: 'https://images.unsplash.com/photo-1537944434965-cf4679d1a598?w=800&auto=format&fit=crop&q=80',
    href: '/vehicles?location=tahoe',
  },
  {
    name: 'Moab',
    tagline: 'Red rock trails',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    href: '/vehicles?location=moab',
  },
  {
    name: 'Bozeman',
    tagline: 'Big Sky country',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    href: '/vehicles?location=bozeman',
  },
]

export function MarketsSection() {
  return (
    <section className="bg-[#F5F2EC] py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        {/* Header */}
        <h2 className="font-serif italic text-4xl lg:text-5xl text-[#1C1F1A] mb-12">
          Where we operate
        </h2>

        {/* Markets Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MARKETS.map((market) => (
            <Link
              key={market.name}
              href={market.href}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden"
            >
              <Image
                src={market.image}
                alt={market.name}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1F1A] via-[#1C1F1A]/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-serif text-3xl text-[#F5F2EC] mb-1">
                  {market.name}
                </h3>
                <p className="text-sm text-[#9A9589]">
                  {market.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
