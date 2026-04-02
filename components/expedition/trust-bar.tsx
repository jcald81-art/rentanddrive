import { Shield, BadgeCheck, Clock, Headphones } from 'lucide-react'

const trustPoints = [
  { icon: Shield, title: 'VIN Verified', desc: 'Every vehicle checked' },
  { icon: BadgeCheck, title: 'Licensed & Insured', desc: 'Full coverage included' },
  { icon: Clock, title: 'Contactless Pickup', desc: '24/7 key access' },
  { icon: Headphones, title: 'Local Support', desc: 'Reno-based team' },
]

export function TrustBar() {
  return (
    <section className="bg-[#CC0000] py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
          {trustPoints.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">{item.title}</div>
                <div className="text-xs text-white/80">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
