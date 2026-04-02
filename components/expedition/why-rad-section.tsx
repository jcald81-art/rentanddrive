import { DollarSign, Mountain, Smartphone, Users } from 'lucide-react'

const reasons = [
  {
    icon: DollarSign,
    title: 'Save 10% vs Turo',
    description: 'Book direct and keep more money in your pocket. No hidden fees, transparent pricing.',
  },
  {
    icon: Mountain,
    title: 'Made for Tahoe',
    description: 'AWD vehicles with snow tires. We know the mountain roads and prepare every vehicle accordingly.',
  },
  {
    icon: Smartphone,
    title: 'Contactless Pickup',
    description: 'Skip the rental counter. Secure lockbox access 24/7 - grab your keys and hit the road.',
  },
  {
    icon: Users,
    title: 'Local Support',
    description: 'Real Reno-based team available 24/7. No overseas call centers, just neighbors helping neighbors.',
  },
]

export function WhyRADSection() {
  return (
    <section className="bg-[#0D0D0D] py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Why Rent and Drive?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            We&apos;re not just another rental platform. We&apos;re locals who understand what you need for Reno and Lake Tahoe adventures.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="text-center md:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#CC0000]/10 md:mx-0">
                <reason.icon className="h-7 w-7 text-[#CC0000]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">{reason.title}</h3>
              <p className="text-sm text-white/60">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
