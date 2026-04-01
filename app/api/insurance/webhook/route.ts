import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roamly, RoamlyWebhookPayload } from '@/integrations/roamly'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-roamly-signature') ?? ''

  // Verify webhook authenticity
  if (process.env.ROAMLY_WEBHOOK_SECRET && !roamly.verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: RoamlyWebhookPayload
  try {
    payload = JSON.parse(body) as RoamlyWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (payload.event) {
      case 'policy.activated': {
        await supabase
          .from('booking_insurance')
          .update({ policy_status: 'active', roamly_bind_response: payload.data as Record<string, unknown> })
          .eq('roamly_policy_id', payload.policy_id)
        break
      }
      case 'policy.cancelled': {
        await supabase
          .from('booking_insurance')
          .update({ policy_status: 'cancelled' })
          .eq('roamly_policy_id', payload.policy_id)
        break
      }
      case 'claim.filed':
      case 'claim.resolved': {
        await supabase
          .from('booking_insurance')
          .update({ policy_status: 'claimed' })
          .eq('roamly_policy_id', payload.policy_id)
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Roamly Webhook Error]:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
