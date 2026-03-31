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
]

export function ExpeditionHero() {
  const [sloganIndex, setSloganIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Rotate slogans every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setSloganIndex((prev) => (prev + 1) % SLOGANS.length)
        setIsAnimating(false)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen bg-card dark:bg-[#1C1F1A] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-card via-muted to-card dark:from-[#1C1F1A] dark:via-[#252923] dark:to-[#1C1F1A]" />
      <div className="absolute inset-0 grain-overlay" />
      
      {/* Hero Vehicle Image - positioned on right side */}
      <div className="absolute right-0 bottom-0 w-full lg:w-[60%] h-[50%] lg:h-[80%]">
        <Image
          src="/images/hero-audi-q5.png"
          alt="2014 Audi Q5 - Premium adventure SUV"
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain object-right-bottom"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C1F1A] via-transparent to-transparent" />
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
