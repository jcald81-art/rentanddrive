import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!

// Use service role for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe Identity Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Return 200 immediately to acknowledge receipt
  const response = NextResponse.json({ received: true })

  // Process the event asynchronously
  try {
    switch (event.type) {
      case 'identity.verification_session.verified': {
        const session = event.data.object as Stripe.Identity.VerificationSession
        await handleVerificationVerified(session)
        break
      }

      case 'identity.verification_session.requires_input': {
        const session = event.data.object as Stripe.Identity.VerificationSession
        await handleVerificationRequiresInput(session)
        break
      }

      case 'identity.verification_session.canceled': {
        const session = event.data.object as Stripe.Identity.VerificationSession
        await handleVerificationCanceled(session)
        break
      }

      default:
        console.log(`[Stripe Identity Webhook] Unhandled event: ${event.type}`)
    }
  } catch (error) {
    console.error('[Stripe Identity Webhook] Error processing event:', error)
    // Still return 200 - we don't want Stripe to retry
  }

  return response
}

async function handleVerificationVerified(session: Stripe.Identity.VerificationSession) {
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('[Stripe Identity] No user_id in session metadata')
    return
  }

  console.log(`[Stripe Identity] Verification verified for user: ${userId}`)

  // Mark user as verified
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      identity_verified: true,
      identity_verification_status: 'verified',
      identity_verified_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[Stripe Identity] Failed to update profile:', error)
    return
  }

  // Create success notification
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'identity_verified',
    title: 'Identity Verified!',
    message: 'Your identity has been verified. You can now book any vehicle on Rent and Drive.',
  })

  console.log(`[Stripe Identity] User ${userId} successfully verified`)
}

async function handleVerificationRequiresInput(session: Stripe.Identity.VerificationSession) {
  const userId = session.metadata?.user_id
  const email = session.metadata?.email

  if (!userId) {
    console.error('[Stripe Identity] No user_id in session metadata')
    return
  }

  console.log(`[Stripe Identity] Verification requires input for user: ${userId}`)

  // Update status
  await supabaseAdmin
    .from('profiles')
    .update({
      identity_verification_status: 'requires_input',
    })
    .eq('id', userId)

  // Create notification to retry
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'identity_requires_input',
    title: 'Verification Needs Attention',
    message: 'We need additional information to verify your identity. Please try again.',
    data: { session_id: session.id },
  })

  // TODO: Send email to retry verification
  // await sendEmail(email, 'verification_retry', { ... })
  console.log(`[Stripe Identity] Would send retry email to: ${email}`)
}

async function handleVerificationCanceled(session: Stripe.Identity.VerificationSession) {
  const userId = session.metadata?.user_id

  if (!userId) {
    return
  }

  console.log(`[Stripe Identity] Verification canceled for user: ${userId}`)

  await supabaseAdmin
    .from('profiles')
    .update({
      identity_verification_status: 'canceled',
      identity_verification_session_id: null,
    })
    .eq('id', userId)
}
