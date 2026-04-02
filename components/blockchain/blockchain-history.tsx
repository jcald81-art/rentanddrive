'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  History, 
  ExternalLink, 
  Car, 
  Clock, 
  MapPin, 
  Camera,
  Shield,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Wrench
} from 'lucide-react'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

interface BlockchainHistoryProps {
  vehicleId: string
  limit?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const eventConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  rental_start: { label: 'Rental Started', icon: Car, color: 'bg-emerald-500/20 text-emerald-400' },
  rental_end: { label: 'Rental Ended', icon: CheckCircle2, color: 'bg-blue-500/20 text-blue-400' },
  handoff_pickup: { label: 'Vehicle Pickup', icon: Car, color: 'bg-amber-500/20 text-amber-400' },
  handoff_return: { label: 'Vehicle Return', icon: Car, color: 'bg-amber-500/20 text-amber-400' },
  inspection: { label: 'Inspection', icon: Shield, color: 'bg-purple-500/20 text-purple-400' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-orange-500/20 text-orange-400' },
  mileage_update: { label: 'Mileage Update', icon: Clock, color: 'bg-gray-500/20 text-gray-400' },
  battery_update: { label: 'Battery Update', icon: Clock, color: 'bg-green-500/20 text-green-400' },
  escrow_created: { label: 'Escrow Created', icon: Wallet, color: 'bg-indigo-500/20 text-indigo-400' },
  escrow_released: { label: 'Escrow Released', icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400' },
  escrow_refunded: { label: 'Escrow Refunded', icon: Wallet, color: 'bg-amber-500/20 text-amber-400' },
  payment_crypto: { label: 'Crypto Payment', icon: Wallet, color: 'bg-purple-500/20 text-purple-400' },
  payment_fiat: { label: 'Fiat Payment', icon: Wallet, color: 'bg-blue-500/20 text-blue-400' },
  damage_reported: { label: 'Damage Reported', icon: AlertTriangle, color: 'bg-red-500/20 text-red-400' },
}

export function BlockchainHistory({ vehicleId, limit = 10 }: BlockchainHistoryProps) {
  const { data, error, isLoading } = useSWR(
    `/api/blockchain/events?vehicleId=${vehicleId}`,
    fetcher
  )

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-white/10">
        <CardHeader>
          <Skeleton className="h-6 w-40 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/10" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return null
  }

  const events = data?.events?.slice(0, limit) || []

  return (
    <Card className="bg-gradient-to-br from-[#1a1f2e] to-[#151820] border-white/10">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <History className="h-5 w-5 text-blue-400" />
          On-Chain History
        </CardTitle>
        <CardDescription className="text-white/60">
          Immutable rental and maintenance records
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No blockchain events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event: {
              id: string
              event_type: string
              chain: string
              tx_hash?: string
              data_hash: string
              event_data: Record<string, unknown>
              gps_lat?: number
              gps_lng?: number
              photo_ipfs_hash?: string
              verified: boolean
              created_at: string
            }) => {
              const config = eventConfig[event.event_type] || { 
                label: event.event_type, 
                icon: Clock, 
                color: 'bg-gray-500/20 text-gray-400' 
              }
              const Icon = config.icon

              return (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-medium">{config.label}</p>
                        <div className="flex items-center gap-2">
                          {event.verified && (
                            <Badge 
                              variant="outline" 
                              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs"
                            >
                              Verified
                            </Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                          >
                            {event.chain}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-white/50 mt-1">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                      
                      {/* Event details */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {event.gps_lat && event.gps_lng && (
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="h-3 w-3" />
                            {event.gps_lat.toFixed(4)}, {event.gps_lng.toFixed(4)}
                          </span>
                        )}
                        
                        {event.photo_ipfs_hash && (
                          <a 
                            href={`https://ipfs.io/ipfs/${event.photo_ipfs_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Camera className="h-3 w-3" />
                            View Photo
                          </a>
                        )}
                        
                        {event.tx_hash && (
                          <a 
                            href={`https://basescan.org/tx/${event.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View TX
                          </a>
                        )}
                      </div>
                      
                      {/* Data hash */}
                      <p className="text-[10px] font-mono text-white/30 mt-2 truncate">
                        Hash: {event.data_hash}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
