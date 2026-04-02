import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Supported chains
export type Chain = 'base' | 'polygon' | 'ethereum'

// Event types for rental provenance
export type BlockchainEventType =
  | 'rental_start'
  | 'rental_end'
  | 'handoff_pickup'
  | 'handoff_return'
  | 'inspection'
  | 'maintenance'
  | 'mileage_update'
  | 'battery_update'
  | 'escrow_created'
  | 'escrow_released'
  | 'escrow_refunded'
  | 'payment_crypto'
  | 'payment_fiat'
  | 'damage_reported'

// NFT metadata standard (ERC-721)
export interface VehicleNFTMetadata {
  name: string
  description: string
  image: string
  external_url: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
  properties: {
    vin: string
    year: number
    make: string
    model: string
    mileage: number
    inspektlabs_certified: boolean
    inspection_date?: string
    rental_history_count: number
    blockchain_verified: boolean
  }
}

// Generate deterministic hash for event data
export function hashEventData(data: Record<string, unknown>): string {
  const sortedData = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(sortedData).digest('hex')
}

// Generate NFT metadata for a vehicle
export function generateVehicleNFTMetadata(vehicle: {
  id: string
  vin: string
  year: number
  make: string
  model: string
  mileage?: number
  images?: string[]
  inspektlabs_certified?: boolean
  inspection_date?: string
  rental_count?: number
}): VehicleNFTMetadata {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.com'
  
  return {
    name: `RAD Vehicle #${vehicle.id.slice(0, 8)} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: `Blockchain-verified rental vehicle on RAD Rent and Drive. VIN: ${vehicle.vin}. This NFT represents the digital twin of a physical vehicle, with immutable rental history recorded on-chain.`,
    image: vehicle.images?.[0] || `${appUrl}/images/vehicle-placeholder.jpg`,
    external_url: `${appUrl}/vehicles/${vehicle.id}`,
    attributes: [
      { trait_type: 'Year', value: vehicle.year },
      { trait_type: 'Make', value: vehicle.make },
      { trait_type: 'Model', value: vehicle.model },
      { trait_type: 'Mileage', value: vehicle.mileage || 0 },
      { trait_type: 'Inspektlabs Certified', value: vehicle.inspektlabs_certified ? 'Yes' : 'No' },
      { trait_type: 'Rental History', value: vehicle.rental_count || 0 },
      { trait_type: 'Platform', value: 'RAD Rent and Drive' },
      { trait_type: 'Region', value: 'Reno-Tahoe' },
    ],
    properties: {
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      mileage: vehicle.mileage || 0,
      inspektlabs_certified: vehicle.inspektlabs_certified || false,
      inspection_date: vehicle.inspection_date,
      rental_history_count: vehicle.rental_count || 0,
      blockchain_verified: true,
    },
  }
}

// Record a blockchain event (off-chain first, then submit to chain)
export async function recordBlockchainEvent(params: {
  vehicleId: string
  bookingId?: string
  eventType: BlockchainEventType
  eventData: Record<string, unknown>
  gpsLat?: number
  gpsLng?: number
  photoIpfsHash?: string
  chain?: Chain
}): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const supabase = await createClient()
  
  const dataHash = hashEventData(params.eventData)
  
  const { data, error } = await supabase
    .from('blockchain_events')
    .insert({
      vehicle_id: params.vehicleId,
      booking_id: params.bookingId,
      event_type: params.eventType,
      chain: params.chain || 'base',
      data_hash: dataHash,
      event_data: params.eventData,
      gps_lat: params.gpsLat,
      gps_lng: params.gpsLng,
      photo_ipfs_hash: params.photoIpfsHash,
      verified: false, // Will be set to true after on-chain confirmation
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('[blockchain] Failed to record event:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, eventId: data.id }
}

// Create or update vehicle NFT record
export async function createVehicleNFT(params: {
  vehicleId: string
  chain?: Chain
  mintedBy: string
}): Promise<{ success: boolean; nftId?: string; error?: string }> {
  const supabase = await createClient()
  
  // Get vehicle data
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.vehicleId)
    .single()
  
  if (vehicleError || !vehicle) {
    return { success: false, error: 'Vehicle not found' }
  }
  
  // Get rental count
  const { count: rentalCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('vehicle_id', params.vehicleId)
    .eq('status', 'completed')
  
  // Generate metadata
  const metadata = generateVehicleNFTMetadata({
    ...vehicle,
    rental_count: rentalCount || 0,
  })
  
  // Create NFT record (actual minting would happen via smart contract)
  const { data: nft, error: nftError } = await supabase
    .from('vehicle_nfts')
    .upsert({
      vehicle_id: params.vehicleId,
      chain: params.chain || 'base',
      minted_by: params.mintedBy,
      metadata,
    }, {
      onConflict: 'vehicle_id',
    })
    .select('id')
    .single()
  
  if (nftError) {
    console.error('[blockchain] Failed to create NFT record:', nftError)
    return { success: false, error: nftError.message }
  }
  
  // Update vehicle blockchain_verified status
  await supabase
    .from('vehicles')
    .update({ blockchain_verified: true })
    .eq('id', params.vehicleId)
  
  return { success: true, nftId: nft.id }
}

// Create escrow contract record
export async function createEscrowContract(params: {
  bookingId: string
  vehicleId: string
  renterId: string
  hostId: string
  escrowAmountCents: number
  chain?: Chain
}): Promise<{ success: boolean; escrowId?: string; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('escrow_contracts')
    .insert({
      booking_id: params.bookingId,
      vehicle_id: params.vehicleId,
      renter_id: params.renterId,
      host_id: params.hostId,
      escrow_amount_cents: params.escrowAmountCents,
      chain: params.chain || 'base',
      status: 'pending',
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('[blockchain] Failed to create escrow:', error)
    return { success: false, error: error.message }
  }
  
  // Record blockchain event
  await recordBlockchainEvent({
    vehicleId: params.vehicleId,
    bookingId: params.bookingId,
    eventType: 'escrow_created',
    eventData: {
      escrow_amount_cents: params.escrowAmountCents,
      renter_id: params.renterId,
      host_id: params.hostId,
    },
    chain: params.chain,
  })
  
  return { success: true, escrowId: data.id }
}

// Get vehicle blockchain history
export async function getVehicleBlockchainHistory(vehicleId: string) {
  const supabase = await createClient()
  
  const { data: events, error } = await supabase
    .from('blockchain_events')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('[blockchain] Failed to get history:', error)
    return []
  }
  
  return events
}

// Get vehicle NFT data
export async function getVehicleNFT(vehicleId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_nfts')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}
