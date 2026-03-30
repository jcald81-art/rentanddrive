import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all courses
    const { data: courses } = await supabase
      .from('academy_courses')
      .select('*')
      .order('sort_order', { ascending: true })

    // Get user's course progress
    const { data: progress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)

    // Get certifications
    const { data: certifications } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', user.id)

    // Get badges earned from academy
    const { data: badges } = await supabase
      .from('host_achievements')
      .select('*')
      .eq('host_id', user.id)
      .like('achievement_type', 'academy_%')

    // Build courses with progress
    const coursesWithProgress = courses?.map(course => {
      const courseProgress = progress?.find(p => p.course_id === course.id)
      return {
        ...course,
        completedLessons: courseProgress?.completed_lessons || 0,
        totalLessons: course.lesson_count || 0,
        progress: course.lesson_count 
          ? Math.round(((courseProgress?.completed_lessons || 0) / course.lesson_count) * 100)
          : 0,
        isCompleted: courseProgress?.is_completed || false,
        startedAt: courseProgress?.started_at,
        completedAt: courseProgress?.completed_at,
      }
    }) || []

    // Group courses by category
    const categories = ['Getting Started', 'Eagle Mastery', 'Dollar Optimization', 'Fleet Scaling', 'Advanced Pricing']
    const coursesByCategory = categories.map(cat => ({
      name: cat,
      courses: coursesWithProgress.filter(c => c.category === cat),
    }))

    return NextResponse.json({
      courses: coursesWithProgress,
      coursesByCategory,
      certifications: certifications || [],
      badges: badges || [],
      stats: {
        coursesCompleted: coursesWithProgress.filter(c => c.isCompleted).length,
        totalCourses: courses?.length || 0,
        certificationsEarned: certifications?.length || 0,
        badgesEarned: badges?.length || 0,
      },
    })
  } catch (error) {
    console.error('Academy error:', error)
    return NextResponse.json({ error: 'Failed to fetch academy data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, lessonId, action } = body

    if (action === 'complete_lesson') {
      // Get current progress
      const { data: progress } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      const completedLessons = (progress?.completed_lessons || 0) + 1

      // Get course info
      const { data: course } = await supabase
        .from('academy_courses')
        .select('lesson_count, xp_reward')
        .eq('id', courseId)
        .single()

      const isCompleted = completedLessons >= (course?.lesson_count || 999)

      // Update or insert progress
      await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          completed_lessons: completedLessons,
          is_completed: isCompleted,
          started_at: progress?.started_at || new Date().toISOString(),
          completed_at: isCompleted ? new Date().toISOString() : null,
        })

      // Award XP if course completed
      if (isCompleted && course?.xp_reward) {
        await supabase
          .from('xp_transactions')
          .insert({
            host_id: user.id,
            xp_amount: course.xp_reward,
            source: 'course_completion',
            source_id: courseId,
            description: `Completed course`,
          })
      }

      return NextResponse.json({ 
        success: true, 
        completedLessons,
        isCompleted,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Academy action error:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}
