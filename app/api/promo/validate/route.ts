import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code, subtotal } = await request.json()

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (error || !promo) {
      return NextResponse.json({ valid: false, message: 'Invalid promo code' }, { status: 200 })
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Promo code has expired' }, { status: 200 })
    }

    // Check usage limit
    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ valid: false, message: 'Promo code usage limit reached' }, { status: 200 })
    }

    // Calculate discount
    let discount = 0
    if (promo.discount_type === 'percentage') {
      discount = Math.round(subtotal * (promo.discount_value / 100))
    } else {
      discount = promo.discount_value * 100
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      calculated_discount: discount,
      message: promo.discount_type === 'percentage' 
        ? `${promo.discount_value}% off applied!` 
        : `$${promo.discount_value} off applied!`,
    })
  } catch (error) {
    console.error('Promo validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
