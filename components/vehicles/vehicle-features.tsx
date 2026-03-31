'use client'

import { Users, Mountain, Snowflake, Truck, Check, Sun, ThermometerSun, Bluetooth, Camera } from 'lucide-react'

interface Feature {
  label: string
  value: string
  available: boolean
}

interface VehicleFeaturesProps {
  features: Feature[]
}

const iconMap: Record<string, React.ElementType> = {
  'Seats': Users,
  'AWD / 4WD': Mountain,
  'Ski Rack': Snowflake,
  'Tow Hitch': Truck,
  'Panoramic sunroof': Sun,
  'Heated seats': ThermometerSun,
  'Bluetooth': Bluetooth,
  'Backup camera': Camera,
}

export function VehicleFeatures({ features }: VehicleFeaturesProps) {
  // Only show features that are available - no "Not available" cards
  const availableFeatures = features.filter((f) => f.available)

  if (availableFeatures.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Vehicle Features</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {availableFeatures.map((feature) => {
          const Icon = iconMap[feature.label] || Check
          return (
            <div
              key={feature.label}
              className="flex flex-col items-center rounded-lg border bg-card p-4 text-center"
            >
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
              <span className="text-xs text-muted-foreground">{feature.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
