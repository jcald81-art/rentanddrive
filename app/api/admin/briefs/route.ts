import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const dateFilter = searchParams.get('date') || 'today'

  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  switch (dateFilter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  const { data: briefs, error } = await supabase
    .from('morning_briefs')
    .select(`
      *,
      host:profiles!morning_briefs_host_id_fkey(full_name, email)
    `)
    .gte('brief_date', startDate.toISOString().split('T')[0])
    .lte('brief_date', endDate.toISOString().split('T')[0])
    .order('generated_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ briefs: briefs || [] })
}
