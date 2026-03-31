'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  name: string
  href: string
}

const STEPS: Step[] = [
  { id: 1, name: 'Trip Details', href: '/booking/details' },
  { id: 2, name: 'Verify', href: '/booking/verify' },
  { id: 3, name: 'Payment', href: '/booking/payment' },
  { id: 4, name: 'Confirmed', href: '/booking/confirmed' },
]

interface BookingProgressBarProps {
  currentStep: number
}

export function BookingProgressBar({ currentStep }: BookingProgressBarProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep

          return (
            <li key={step.id} className="relative flex flex-1 items-center">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute left-0 top-4 h-0.5 w-full -translate-x-1/2',
                    isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                  )}
                  style={{ width: 'calc(100% - 2rem)', left: 'calc(-50% + 1rem)' }}
                />
              )}

              {/* Step circle and label */}
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    isUpcoming && 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
