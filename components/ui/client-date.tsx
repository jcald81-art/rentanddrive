'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface ClientDateProps {
  date: string | Date
  formatStr?: string
  fallback?: string
  className?: string
}

/**
 * Client-side date formatting component to prevent hydration mismatches.
 * Renders a placeholder on server, then formats the date on client.
 */
export function ClientDate({ 
  date, 
  formatStr = 'MMM d, yyyy', 
  fallback = '—',
  className 
}: ClientDateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className={className} suppressHydrationWarning>{fallback}</span>
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return <span className={className}>{format(dateObj, formatStr)}</span>
  } catch {
    return <span className={className}>{fallback}</span>
  }
}

/**
 * Client-side date range formatting
 */
export function ClientDateRange({
  startDate,
  endDate,
  formatStr = 'MMM d',
  separator = ' - ',
  className
}: {
  startDate: string | Date
  endDate: string | Date
  formatStr?: string
  separator?: string
  className?: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className={className} suppressHydrationWarning>—</span>
  }

  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    return (
      <span className={className}>
        {format(start, formatStr)}{separator}{format(end, formatStr)}
      </span>
    )
  } catch {
    return <span className={className}>—</span>
  }
}
