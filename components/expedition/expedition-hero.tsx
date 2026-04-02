import { HeroSearchBar } from '@/components/hero-search-bar'

export function ExpeditionHero() {
  return (
    <section className="relative min-h-[85vh] bg-[#0D0D0D] flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&auto=format&fit=crop&q=80')" 
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#CC0000]" />
          <span className="text-sm text-white/90">Save 10% vs Turo - Book Direct</span>
        </div>

        {/* Heading */}
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Premium Rides for{' '}
          <span className="text-[#CC0000]">Reno</span> &{' '}
          <span className="text-[#CC0000]">Lake Tahoe</span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mb-10 max-w-2xl text-balance text-lg text-white/70 md:text-xl">
          AWD vehicles with snow tires. Contactless pickup. VIN verified. 
          Local support 24/7. Your adventure starts here.
        </p>

        {/* Search Bar */}
        <HeroSearchBar />

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { value: '500+', label: 'Verified Vehicles' },
            { value: '4.9', label: 'Average Rating' },
            { value: '10%', label: 'Savings vs Turo' },
            { value: '24/7', label: 'Local Support' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-white md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0D0D0D] to-transparent" />
    </section>
  )
}
