import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Get vehicle to find host
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('host_id')
      .eq('id', vehicleId)
      .single()

    if (!vehicle) {
      return NextResponse.json([])
    }

    // Get host's active add-ons
    const { data: addons, error } = await supabase
      .from('host_addons')
      .select('id, name, category, description, price, quantity, icon')
      .eq('host_id', vehicle.host_id)
      .eq('active', true)
      .order('category', { ascending: true })

    if (error) {
      console.error('Failed to fetch addons:', error)
      // Return mock data as fallback
      return NextResponse.json([
        { id: '1', icon: '👶', name: 'Infant Car Seat', price: 15, quantity: 2, description: 'Rear-facing infant car seat', category: 'Baby & Kids' },
        { id: '2', icon: '🧊', name: 'Cooler (48qt)', price: 12, quantity: 1, description: 'Large cooler for road trips', category: 'Comfort' },
        { id: '3', icon: '⛓️', name: 'Tire Chains', price: 20, quantity: 1, description: 'Snow chains for winter driving', category: 'Adventure' },
        { id: '4', icon: '📡', name: 'WiFi Hotspot', price: 15, quantity: 1, description: 'Unlimited 4G LTE data', category: 'Travel' },
      ])
    }

    return NextResponse.json(addons || [])
  } catch (error) {
    console.error('Error fetching addons:', error)
    return NextResponse.json([])
  }
}
