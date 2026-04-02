'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BlockchainVerifiedBadge } from './blockchain-verified-badge'
import { 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  FileText,
  Car,
  History,
  Shield
} from 'lucide-react'
import useSWR from 'swr'

interface VehicleNFTCardProps {
  vehicleId: string
  canMint?: boolean
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function VehicleNFTCard({ vehicleId, canMint = false }: VehicleNFTCardProps) {
  const [isMinting, setIsMinting] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/blockchain/nft?vehicleId=${vehicleId}`,
    fetcher
  )

  const handleMint = async () => {
    setIsMinting(true)
    try {
      const response = await fetch('/api/blockchain/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, chain: 'base' }),
      })
      
      if (response.ok) {
        mutate()
      }
    } catch (err) {
      console.error('Failed to mint NFT:', err)
    } finally {
      setIsMinting(false)
    }
  }

  const copyTokenId = async () => {
    if (data?.nft?.token_id) {
      await navigator.clipboard.writeText(data.nft.token_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-white/10">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-white/10" />
          <Skeleton className="h-4 w-60 bg-white/10" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full bg-white/10" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return null
  }

  const nft = data?.nft
  const metadata = data?.metadata
  const vehicle = data?.vehicle

  return (
    <Card className="bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-white/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Vehicle NFT Digital Twin
          </CardTitle>
          {vehicle?.blockchain_verified && (
            <BlockchainVerifiedBadge
              verified={true}
              chain={nft?.chain || 'base'}
              tokenId={nft?.token_id}
              txHash={nft?.mint_tx_hash}
              size="sm"
            />
          )}
        </div>
        <CardDescription className="text-white/60">
          Immutable on-chain proof of vehicle history and rentals
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Vehicle Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
          <Car className="h-5 w-5 text-white/40" />
          <div>
            <p className="text-white font-medium">
              {vehicle?.year} {vehicle?.make} {vehicle?.model}
            </p>
            <p className="text-xs text-white/50">VIN: {vehicle?.vin}</p>
          </div>
        </div>

        {nft ? (
          <>
            {/* NFT Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/50 mb-1">Chain</p>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {nft.chain?.charAt(0).toUpperCase() + nft.chain?.slice(1) || 'Base'}
                </Badge>
              </div>
              
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-white/50 mb-1">Status</p>
                <Badge 
                  variant="outline" 
                  className={nft.mint_tx_hash 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }
                >
                  {nft.mint_tx_hash ? 'Minted' : 'Ready to Mint'}
                </Badge>
              </div>
            </div>

            {nft.token_id && (
              <div className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-1">Token ID</p>
                    <p className="text-white font-mono text-sm">#{nft.token_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyTokenId}
                    className="text-white/60 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata Preview */}
            {metadata && (
              <div className="p-3 rounded-lg bg-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <FileText className="h-3.5 w-3.5" />
                  Metadata Attributes
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.attributes?.slice(0, 5).map((attr: { trait_type: string; value: string | number }, i: number) => (
                    <Badge 
                      key={i} 
                      variant="secondary" 
                      className="bg-white/10 text-white/70 text-xs"
                    >
                      {attr.trait_type}: {attr.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {nft.mint_tx_hash ? (
                <Button
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  asChild
                >
                  <a
                    href={`https://basescan.org/tx/${nft.mint_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Chain
                  </a>
                </Button>
              ) : canMint && (
                <Button
                  onClick={handleMint}
                  disabled={isMinting}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isMinting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Mint NFT
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                asChild
              >
                <a href={`/vehicles/${vehicleId}/history`}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </a>
              </Button>
            </div>
          </>
        ) : (
          /* No NFT yet - show create option */
          <div className="text-center py-6">
            <Shield className="h-12 w-12 mx-auto text-white/20 mb-3" />
            <p className="text-white/60 mb-4">
              This vehicle hasn&apos;t been registered on the blockchain yet.
            </p>
            {canMint && (
              <Button
                onClick={handleMint}
                disabled={isMinting}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isMinting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Digital Twin
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
