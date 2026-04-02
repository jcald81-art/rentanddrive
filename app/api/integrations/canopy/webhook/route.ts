import { NextRequest, NextResponse } from 'next/server'
import { handleCanopyWebhook } from '@/lib/integrations/canopy'
import crypto from 'crypto'

const CANOPY_WEBHOOK_SECRET = process.env.CANOPY_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify webhook signature if secret is configured
    if (CANOPY_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-canopy-signature')
      const expectedSignature = crypto
        .createHmac('sha256', CANOPY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('[v0] Canopy webhook signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    
    const result = await handleCanopyWebhook(payload)

    if (!result.success) {
      console.error('[v0] Canopy webhook processing failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Canopy webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
