'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Shield, ExternalLink } from 'lucide-react'

interface BlockchainVerifiedBadgeProps {
  verified: boolean
  chain?: 'base' | 'polygon' | 'ethereum'
  tokenId?: string
  txHash?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const chainConfig = {
  base: {
    name: 'Base',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    explorer: 'https://basescan.org/tx/',
  },
  polygon: {
    name: 'Polygon',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    explorer: 'https://polygonscan.com/tx/',
  },
  ethereum: {
    name: 'Ethereum',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    explorer: 'https://etherscan.io/tx/',
  },
}

export function BlockchainVerifiedBadge({
  verified,
  chain = 'base',
  tokenId,
  txHash,
  size = 'md',
  showLabel = true,
}: BlockchainVerifiedBadgeProps) {
  if (!verified) return null

  const config = chainConfig[chain]
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const content = (
    <Badge
      variant="outline"
      className={`${config.color} flex items-center gap-1.5 font-medium border`}
    >
      <Shield className={sizeClasses[size]} />
      {showLabel && <span>Blockchain Verified</span>}
    </Badge>
  )

  if (!txHash) {
    return content
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`${config.explorer}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex hover:opacity-80 transition-opacity"
          >
            {content}
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-background border">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Verified on {config.name}</span>
            {tokenId && <span className="text-muted-foreground">Token ID: #{tokenId}</span>}
            <span className="flex items-center gap-1 text-muted-foreground">
              View on explorer <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
