import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const category = searchParams.get('category')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const awd = searchParams.get('awd')
  const skiRack = searchParams.get('ski_rack')
  const minRate = searchParams.get('min_rate')
  const maxRate = searchParams.get('max_rate')

  let query = supabase.from('active_listings').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  if (awd === 'true') {
    query = query.eq('is_awd', true)
  }

  if (skiRack === 'true') {
    query = query.eq('has_ski_rack', true)
  }

  if (minRate) {
    query = query.gte('daily_rate', parseFloat(minRate))
  }

  if (maxRate) {
    query = query.lte('daily_rate', parseFloat(maxRate))
  }

  // Filter by availability if dates provided
  if (startDate && endDate) {
    query = query
      .lte('available_from', startDate)
      .gte('available_to', endDate)
  }

  const { data, error } = await query.order('daily_rate', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
