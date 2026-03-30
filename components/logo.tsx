'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
}

export function Logo({ className, size = 'md', showText = true, linkTo = '/' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  const LogoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Animated Car Logo */}
      <div className="relative">
        <svg
          viewBox="0 0 50 40"
          className={cn(sizeClasses[size], 'drop-shadow-lg')}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Road/Speed lines behind */}
          <g className="animate-pulse" style={{ animationDuration: '2s' }}>
            <line x1="0" y1="28" x2="8" y2="28" stroke="#CC0000" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <line x1="2" y1="24" x2="10" y2="24" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
            <line x1="1" y1="32" x2="9" y2="32" stroke="#CC0000" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </g>
          
          {/* Main car body - sporty SUV silhouette */}
          <g>
            {/* Car body shadow */}
            <path
              d="M12 35 L12 28 L18 22 L26 18 L40 18 L46 24 L46 35 Z"
              fill="#990000"
              opacity="0.3"
              transform="translate(1, 1)"
            />
            
            {/* Car body main */}
            <path
              d="M12 35 L12 28 L18 22 L26 18 L40 18 L46 24 L46 35 Z"
              fill="url(#carGradient)"
            />
            
            {/* Roof line */}
            <path
              d="M18 22 L26 18 L36 18 L38 22"
              fill="none"
              stroke="#FF3333"
              strokeWidth="1"
              opacity="0.6"
            />
            
            {/* Windows */}
            <path
              d="M20 23 L25 20 L34 20 L36 23 Z"
              fill="#1a1a2e"
              opacity="0.9"
            />
            
            {/* Window shine */}
            <line x1="22" y1="21.5" x2="28" y2="21.5" stroke="white" strokeWidth="0.5" opacity="0.4" />
            
            {/* Headlight */}
            <ellipse cx="44" cy="26" rx="2" ry="1.5" fill="#FFDD44" opacity="0.9">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="1.5s" repeatCount="indefinite" />
            </ellipse>
            
            {/* Grill lines */}
            <line x1="44" y1="29" x2="46" y2="29" stroke="#333" strokeWidth="0.5" />
            <line x1="44" y1="31" x2="46" y2="31" stroke="#333" strokeWidth="0.5" />
          </g>
          
          {/* Wheels with spin animation */}
          <g>
            {/* Rear wheel */}
            <circle cx="19" cy="35" r="5" fill="#222" />
            <circle cx="19" cy="35" r="4" fill="#444" />
            <circle cx="19" cy="35" r="2.5" fill="#666">
              <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 19 35" to="360 19 35" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="19" cy="35" r="1" fill="#888" />
            
            {/* Front wheel */}
            <circle cx="38" cy="35" r="5" fill="#222" />
            <circle cx="38" cy="35" r="4" fill="#444" />
            <circle cx="38" cy="35" r="2.5" fill="#666">
              <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 38 35" to="360 38 35" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="38" cy="35" r="1" fill="#888" />
          </g>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF2222" />
              <stop offset="50%" stopColor="#CC0000" />
              <stop offset="100%" stopColor="#990000" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span className={cn('font-bold tracking-tight', textSizes[size])}>
          <span className="text-[#CC0000]">Rent</span>
          <span className="text-foreground">&</span>
          <span className="text-foreground">Drive</span>
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link href={linkTo} className="transition-transform hover:scale-105">
        {LogoContent}
      </Link>
    )
  }

  return LogoContent
}
