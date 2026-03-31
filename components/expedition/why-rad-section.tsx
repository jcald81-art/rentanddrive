export function WhyRADSection() {
  const features = [
    {
      stat: '10%',
      title: 'Keep more of what you earn',
      description: 'vs 25-35% on Turo. The math is obvious.',
    },
    {
      stat: 'Real-time',
      title: 'RAD Fleet Command on every trip',
      description: 'GPS tracking, geofencing, and OBD2 health monitoring on every vehicle in the fleet.',
    },
    {
      stat: 'Verified',
      title: 'CarFidelity Certified',
      description: 'VIN history, NHTSA recall check, pre-trip inspection. Every vehicle earns its badge.',
    },
  ]

  return (
    <section className="bg-[#1C1F1A] py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        {/* Header */}
        <h2 className="font-serif text-4xl lg:text-5xl text-[#F5F2EC] mb-16">
          Built different.
        </h2>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#252822] rounded-2xl p-8 border-l-4 border-[#2D4A2D]"
            >
              <p className="font-serif text-5xl lg:text-6xl text-[#F5F2EC] mb-4">
                {feature.stat}
              </p>
              <h3 className="text-xl font-medium text-[#F5F2EC] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#9A9589] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
