import Image from 'next/image'
import Link from 'next/link'
import { Shield, Radio } from 'lucide-react'

interface VehicleCardProps {
  id: string
  name: string
  image: string
  price: number
  specs: string[]
  certified?: boolean
  tracked?: boolean
}

export function VehicleCard({
  id,
  name,
  image,
  price,
  specs,
  certified = true,
  tracked = true,
}: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${id}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden card-hover">
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* CarFidelity Badge */}
          {certified && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-[#2D4A2D] text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <Shield className="h-3.5 w-3.5" />
              CarFidelity Certified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-serif text-xl text-[#1C1F1A] mb-2 group-hover:text-[#2D4A2D] transition-colors">
            {name}
          </h3>
          
          <p className="text-sm text-[#9A9589] mb-4">
            {specs.join(' · ')}
          </p>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-medium text-[#1C1F1A]">${price}</span>
              <span className="text-sm text-[#9A9589]">/day</span>
            </div>

            {/* Eagle Eye Badge */}
            {tracked && (
              <div className="flex items-center gap-1.5 text-xs text-[#9A9589]">
                <Radio className="h-3.5 w-3.5" />
                GPS Tracked
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
