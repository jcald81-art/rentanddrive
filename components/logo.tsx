'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
}

export function Logo({ className, size = 'md', showText = false, linkTo = '/' }: LogoProps) {
  const sizeClasses = {
    sm: { width: 120, height: 48 },
    md: { width: 160, height: 64 },
    lg: { width: 200, height: 80 },
  }

  const LogoContent = (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/images/logo.png"
        alt="Rent and Drive - Reno Sparks Lake Tahoe"
        width={sizeClasses[size].width}
        height={sizeClasses[size].height}
        className="object-contain"
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
