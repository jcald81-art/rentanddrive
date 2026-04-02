'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Check, Car, Camera, CreditCard, Rocket, Calendar, Settings } from 'lucide-react'

const STEPS = [
  { id: 'details', label: 'Vehicle Info', path: '/host/vehicles/add/details', icon: Car },
  { id: 'photos', label: 'Photos', path: '/host/vehicles/add/photos', icon: Camera },
  { id: 'availability', label: 'Availability', path: '/host/vehicles/add/availability', icon: Calendar },
  { id: 'settings', label: 'Rules', path: '/host/vehicles/add/settings', icon: Settings },
  { id: 'payout', label: 'Payout', path: '/host/vehicles/add/payout', icon: CreditCard },
  { id: 'publish', label: 'Go Live', path: '/host/vehicles/add/publish', icon: Rocket },
]

export default function AddVehicleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  const currentStepIndex = STEPS.findIndex(step => pathname.includes(step.id))
  
  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Progress Bar - Sticky */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex
              const isCurrent = index === currentStepIndex
              const Icon = step.icon
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <Link 
                    href={isComplete || isCurrent ? step.path : '#'}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all
                      ${isComplete 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-[#e63946] text-white ring-4 ring-[#e63946]/30' 
                          : 'bg-white/10 text-white/40'
                      }
                      ${(isComplete || isCurrent) ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                    `}
                  >
                    {isComplete ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </Link>
                  
                  {/* Step Label */}
                  <span className={`
                    ml-2 text-sm font-medium hidden sm:block
                    ${isCurrent ? 'text-white' : isComplete ? 'text-green-400' : 'text-white/40'}
                  `}>
                    {step.label}
                  </span>
                  
                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-4
                      ${index < currentStepIndex ? 'bg-green-500' : 'bg-white/10'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* RAD vs Turo Earnings Banner - Sticky Bottom on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0a0f1e] to-[#1a1f3e] border-t border-white/10 p-3 sm:hidden">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-white/60">RAD pays</span>
          <span className="text-[#e63946] font-bold">90%</span>
          <span className="text-white/60">vs Turo&apos;s</span>
          <span className="text-white/40 line-through">65-75%</span>
        </div>
      </div>
    </div>
  )
}
