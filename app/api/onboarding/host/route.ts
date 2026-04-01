import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create onboarding record
    let { data: onboarding, error } = await supabase
      .from('host_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newOnboarding, error: insertError } = await supabase
        .from('host_onboarding')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      onboarding = newOnboarding
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ onboarding })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      // Step 1: Profile
      avatar_url,
      full_name,
      phone,
      license_front_url,
      license_back_url,
      license_number,
      license_state,
      license_expiry,
      // Step 2: Business
      business_name,
      business_type,
      // Step 3: Background check triggered externally
      // Step 4: First vehicle
      first_vehicle_id,
      // Progress
      current_step,
      profile_completed,
      completed,
    } = body

    const updates: Record<string, any> = {}
    
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone
    if (license_front_url !== undefined) updates.license_front_url = license_front_url
    if (license_back_url !== undefined) updates.license_back_url = license_back_url
    if (license_number !== undefined) updates.license_number = license_number
    if (license_state !== undefined) updates.license_state = license_state
    if (license_expiry !== undefined) updates.license_expiry = license_expiry
    if (business_name !== undefined) updates.business_name = business_name
    if (business_type !== undefined) updates.business_type = business_type
    if (first_vehicle_id !== undefined) updates.first_vehicle_id = first_vehicle_id
    if (current_step !== undefined) updates.current_step = current_step
    if (profile_completed !== undefined) updates.profile_completed = profile_completed
    if (completed !== undefined) {
      updates.completed = completed
      if (completed) updates.completed_at = new Date().toISOString()
    }

    const { data: onboarding, error } = await supabase
      .from('host_onboarding')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update profile if relevant fields changed
    if (full_name || phone || avatar_url) {
      const profileUpdates: Record<string, any> = {}
      if (full_name) profileUpdates.full_name = full_name
      if (phone) profileUpdates.phone = phone
      if (avatar_url) profileUpdates.avatar_url = avatar_url
      
      await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
    }

    return NextResponse.json({ onboarding })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
