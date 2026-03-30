import { Shield, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VerificationBadgeProps {
  verified: boolean
  className?: string
  showText?: boolean
}

export function VerificationBadge({ 
  verified, 
  className,
  showText = true 
}: VerificationBadgeProps) {
  if (verified) {
    return (
      <div 
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-green-100 text-green-700 border border-green-200',
          className
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {showText && <span>ID Verified</span>}
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-gray-100 text-gray-600 border border-gray-200',
        className
      )}
    >
      <Shield className="h-3.5 w-3.5" />
      {showText && <span>ID Required</span>}
    </div>
  )
}
