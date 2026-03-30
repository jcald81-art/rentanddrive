import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all model statuses
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('model_status')
      .select('*')
      .order('model_name')

    if (error) throw error

    return NextResponse.json({ models: data || [] })
  } catch (error) {
    console.error('Failed to fetch model status:', error)
    return NextResponse.json({ models: [] })
  }
}

// POST - Toggle model availability
export async function POST(request: NextRequest) {
  try {
    const { model_name, disabled } = await request.json()

    if (!model_name) {
      return NextResponse.json(
        { error: 'model_name required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('model_status')
      .update({
        is_manually_disabled: disabled,
        updated_at: new Date().toISOString(),
      })
      .eq('model_name', model_name)

    if (error) throw error

    // Log the action
    await supabase.from('agent_logs').insert({
      agent_name: 'admin',
      action_type: disabled ? 'model_disabled' : 'model_enabled',
      input_data: { model_name },
      output_data: { success: true },
      status: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to toggle model:', error)
    return NextResponse.json(
      { error: 'Failed to toggle model' },
      { status: 500 }
    )
  }
}
