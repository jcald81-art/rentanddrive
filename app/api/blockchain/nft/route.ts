import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVehicleNFT, getVehicleNFT, generateVehicleNFTMetadata } from '@/lib/blockchain'

// POST: Create/mint vehicle NFT
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { vehicleId, chain } = body
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 })
    }
    
    // Verify user is host of vehicle
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('host_id')
      .eq('id', vehicleId)
      .single()
    
    if (!vehicle || vehicle.host_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: Must be vehicle owner' }, { status: 403 })
    }
    
    // Check if NFT already exists
    const existingNft = await getVehicleNFT(vehicleId)
    if (existingNft?.mint_tx_hash) {
      return NextResponse.json({ 
        error: 'NFT already minted',
        nft: existingNft 
      }, { status: 409 })
    }
    
    const result = await createVehicleNFT({
      vehicleId,
      chain: chain || 'base',
      mintedBy: user.id,
    })
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      nftId: result.nftId,
      message: 'Vehicle NFT record created. Ready for on-chain minting.' 
    })
  } catch (error) {
    console.error('[api/blockchain/nft] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get vehicle NFT data and metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Missing vehicleId parameter' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get NFT record
    const nft = await getVehicleNFT(vehicleId)
    
    // Get vehicle data for metadata preview
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*, bookings(count)')
      .eq('id', vehicleId)
      .single()
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }
    
    // Get rental count
    const { count: rentalCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'completed')
    
    // Generate current metadata
    const metadata = generateVehicleNFTMetadata({
      ...vehicle,
      rental_count: rentalCount || 0,
    })
    
    return NextResponse.json({
      nft,
      metadata,
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        blockchain_verified: vehicle.blockchain_verified,
      }
    })
  } catch (error) {
    console.error('[api/blockchain/nft] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
