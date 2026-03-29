import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalBriefs },
    { data: qualityData },
    { count: positiveFeedback },
    { count: negativeFeedback },
    { count: briefsToday },
    { count: totalHosts },
    { count: hostsWithBriefToday },
  ] = await Promise.all([
    supabase.from('morning_briefs').select('*', { count: 'exact', head: true }),
    supabase.from('morning_briefs')
      .select('quality_score')
      .not('quality_score', 'is', null),
    supabase.from('morning_briefs')
      .select('*', { count: 'exact', head: true })
      .eq('host_feedback', 'positive'),
    supabase.from('morning_briefs')
      .select('*', { count: 'exact', head: true })
      .eq('host_feedback', 'negative'),
    supabase.from('morning_briefs')
      .select('*', { count: 'exact', head: true })
      .gte('brief_date', today.toISOString().split('T')[0]),
    supabase.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'host'),
    supabase.from('morning_briefs')
      .select('host_id', { count: 'exact', head: true })
      .gte('brief_date', today.toISOString().split('T')[0]),
  ])

  const avgQualityScore = qualityData && qualityData.length > 0
    ? qualityData.reduce((sum, b) => sum + (b.quality_score || 0), 0) / qualityData.length
    : 0

  return NextResponse.json({
    total_briefs: totalBriefs || 0,
    avg_quality_score: avgQualityScore,
    positive_feedback: positiveFeedback || 0,
    negative_feedback: negativeFeedback || 0,
    briefs_today: briefsToday || 0,
    hosts_without_brief: (totalHosts || 0) - (hostsWithBriefToday || 0),
  })
}
