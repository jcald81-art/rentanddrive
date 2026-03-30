'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoVariant = 'simple' | 'badge' | 'suv-badge' | 'suv-mountain' | 'suv-banner' | 'poster'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: LogoVariant
  linkTo?: string
}

const logoSources: Record<LogoVariant, string> = {
  'simple': '/images/logo-simple.png',
  'badge': '/images/logo-badge.png',
  'suv-badge': '/images/logo-suv-badge.png',
  'suv-mountain': '/images/logo-suv-mountain.png',
  'suv-banner': '/images/logo-suv-banner.png',
  'poster': '/images/logo-poster.png',
}

export function Logo({ className, size = 'md', variant = 'simple', linkTo = '/' }: LogoProps) {
  const sizeClasses = {
    sm: { width: 100, height: 40 },
    md: { width: 150, height: 60 },
    lg: { width: 200, height: 80 },
    xl: { width: 300, height: 120 },
  }

  const LogoContent = (
    <div className={cn('flex items-center', className)}>
      <Image
        src={logoSources[variant]}
        alt="Rent and Drive - Reno Sparks Lake Tahoe"
        width={sizeClasses[size].width}
        height={sizeClasses[size].height}
        className="object-contain"
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
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
