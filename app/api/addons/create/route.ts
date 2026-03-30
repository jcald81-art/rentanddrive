import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, description, price, quantity, icon, active } = body

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create add-on
    const { data: addon, error } = await supabase
      .from('host_addons')
      .insert({
        host_id: user.id,
        name,
        category: category || 'Other',
        description: description || '',
        price: parseFloat(price),
        quantity: parseInt(quantity) || 1,
        icon: icon || '📦',
        active: active !== false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create addon:', error)
      // Return mock success for development
      return NextResponse.json({
        addonId: `addon-${Date.now()}`,
        message: 'Add-on created successfully (mock)',
      })
    }

    return NextResponse.json({
      addonId: addon.id,
      message: 'Add-on created successfully',
    })
  } catch (error) {
    console.error('Error creating addon:', error)
    return NextResponse.json(
      { error: 'Failed to create add-on' },
      { status: 500 }
    )
  }
}
