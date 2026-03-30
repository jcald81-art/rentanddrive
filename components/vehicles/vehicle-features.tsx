'use client'

import { Users, Mountain, Snowflake, Truck, Check, X } from 'lucide-react'

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
}

export function VehicleFeatures({ features }: VehicleFeaturesProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Vehicle Features</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {features.map((feature) => {
          const Icon = iconMap[feature.label] || Check
          return (
            <div
              key={feature.label}
              className={`flex flex-col items-center rounded-lg border p-4 text-center ${
                feature.available ? 'bg-card' : 'bg-muted/50 opacity-60'
              }`}
            >
              <div
                className={`mb-2 flex size-10 items-center justify-center rounded-full ${
                  feature.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {feature.available ? (
                  <Icon className="size-5" />
                ) : (
                  <X className="size-5" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
              <span className="text-xs text-muted-foreground">
                {feature.available ? feature.value : 'Not available'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
