'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

const SLOGANS = [
  { main: "The vehicle your adventure", highlight: "deserves." },
  { main: "Make your next rental", highlight: "a RAD rental." },
  { main: "Not just a rental.", highlight: "A RAD rental." },
  { main: "Your last rental was fine.", highlight: "Your next one? RAD." },
  { main: "You deserve", highlight: "a RAD rental." },
  { main: "One RAD rental", highlight: "and you'll never go back." },
  { main: "The road is calling.", highlight: "RAD gets you there." },
  { main: "Your keys. Your rules.", highlight: "Your adventure." },
  { main: "Every trip starts with trust.", highlight: "RAD delivers both." },
  { main: "The best rentals don't come from a lot —", highlight: "they come from people." },
  { main: "Reno to Tahoe. Your terms.", highlight: "Go RAD." },
  { main: "Transparent pricing. Real vehicles.", highlight: "Real hosts. That's RAD." },
  { main: "We take 10%. You keep the rest.", highlight: "That's the RAD difference." },
  { main: "Fleet-grade GPS. Keyless access.", highlight: "Zero hassle. RAD." },
  { main: "Not a rental car company.", highlight: "Better." },
  { main: "Your co-pilot from booking to return.", highlight: "Ask RAD anything." },
  { main: "The Sierras are waiting.", highlight: "Start your trip on rentanddrive.net." },
  { main: "Hosts who care. Vehicles that are verified.", highlight: "Adventures worth taking." },
]

// Random interval between 40-60 seconds
const getRandomInterval = () => Math.floor(Math.random() * (60000 - 40000 + 1)) + 40000

export function ExpeditionHero() {
  // Start with index 0 for hydration consistency
  const [sloganIndex, setSloganIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Start slogan rotation after hydration - no immediate random jump
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const scheduleNextSlogan = () => {
      const interval = getRandomInterval()
      timeoutId = setTimeout(() => {
        setIsAnimating(true)
        setTimeout(() => {
          // Pick a random next slogan (not sequential) for variety
          setSloganIndex((prev) => {
            let next = Math.floor(Math.random() * SLOGANS.length)
            // Avoid showing same slogan twice
            while (next === prev && SLOGANS.length > 1) {
              next = Math.floor(Math.random() * SLOGANS.length)
            }
            return next
          })
          setIsAnimating(false)
          scheduleNextSlogan()
        }, 300)
      }, interval)
    }

    scheduleNextSlogan()
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <section className="relative min-h-screen bg-card overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-card via-muted to-card" />
      <div className="absolute inset-0 grain-overlay" />
      
      {/* Hero Vehicle Image - positioned on right side */}
      <div className="absolute right-0 bottom-0 w-full lg:w-[60%] h-[50%] lg:h-[80%]">
        <Image
          src="/images/hero-car.jpg"
          alt="Premium SUV - Your next adventure awaits"
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain object-right-bottom"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-20 pt-40 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
          {/* Text Content */}
          <div className="animate-fade-up">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-[84px] text-foreground leading-[0.95] tracking-tight mb-8">
              <span 
                className={`block transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
              >
                {SLOGANS[sloganIndex].main}<br />
                <span className="italic text-accent">{SLOGANS[sloganIndex].highlight}</span>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg font-light leading-relaxed animate-fade-up-delay-1">
              Rent directly from local hosts in Reno, Sparks, and Tahoe. 
              More vehicle. Less commission.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-sm text-muted-foreground font-medium">Explore vehicles</span>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </section>
  )
}
