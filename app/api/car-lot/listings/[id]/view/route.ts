import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  // Increment view count
  const { error } = await supabase.rpc('increment_listing_views', { listing_id: id })
  
  if (error) {
    // If RPC doesn't exist, do manual update
    await supabase
      .from('vehicle_listings')
      .update({ views_count: supabase.rpc('views_count', {}) })
      .eq('id', id)
  }
  
  return NextResponse.json({ success: true })
}
