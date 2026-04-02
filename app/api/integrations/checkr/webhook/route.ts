import { NextRequest, NextResponse } from 'next/server'
import { handleCheckrWebhook } from '@/lib/integrations/checkr'
import crypto from 'crypto'

const CHECKR_WEBHOOK_SECRET = process.env.CHECKR_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify webhook signature if secret is configured
    if (CHECKR_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-checkr-signature')
      const expectedSignature = crypto
        .createHmac('sha256', CHECKR_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('[v0] Checkr webhook signature mismatch')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    
    // Only process report.completed events
    if (payload.type !== 'report.completed') {
      return NextResponse.json({ received: true })
    }

    const result = await handleCheckrWebhook(payload)

    if (!result.success) {
      console.error('[v0] Checkr webhook processing failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Checkr webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
