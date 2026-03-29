import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Generate unique discount code
function generateDiscountCode(): string {
  const prefix = 'SOCIAL'
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}${random}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the reward
    const { data: reward, error: fetchError } = await supabase
      .from('social_rewards')
      .select(`
        id,
        user_id,
        platform,
        post_type,
        reward_amount_cents,
        status,
        user:users!social_rewards_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (reward.status !== 'pending') {
      return NextResponse.json({ error: 'Reward has already been processed' }, { status: 400 })
    }

    // Generate discount code
    const discountCode = generateDiscountCode()

    // Update reward as approved
    const { error: updateError } = await supabase
      .from('social_rewards')
      .update({
        status: 'approved',
        discount_code: discountCode,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error approving reward:', updateError)
      return NextResponse.json({ error: 'Failed to approve reward' }, { status: 500 })
    }

    // Send email with discount code via SendGrid
    if (process.env.SENDGRID_API_KEY && reward.user?.email) {
      try {
        const discountAmount = (reward.reward_amount_cents / 100).toFixed(0)
        
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: reward.user.email }] }],
            from: { 
              email: process.env.SENDGRID_FROM_EMAIL || 'rewards@rentanddrive.net',
              name: 'Rent and Drive'
            },
            subject: `Your $${discountAmount} Discount Code is Here! 🎉`,
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #CC0000, #990000); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Sharing!</h1>
                  </div>
                  
                  <div style="background: #f9f9f9; padding: 40px 30px;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Hi ${reward.user.full_name || 'there'}! 👋
                    </p>
                    
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Your <strong>${reward.platform}</strong> ${reward.post_type} has been approved! 
                      Here's your exclusive discount code:
                    </p>
                    
                    <div style="background: white; border: 2px dashed #CC0000; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                      <p style="font-size: 12px; color: #666; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                        Your Discount Code
                      </p>
                      <p style="font-size: 32px; font-weight: bold; color: #CC0000; margin: 0; font-family: monospace;">
                        ${discountCode}
                      </p>
                      <p style="font-size: 18px; color: #333; margin: 10px 0 0 0;">
                        <strong>$${discountAmount} OFF</strong> your next booking
                      </p>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
                      Use this code at checkout on your next rental. Code expires in 90 days.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/vehicles" 
                         style="display: inline-block; background: #CC0000; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                        Browse Vehicles
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin: 30px 0 0 0;">
                      Keep sharing your adventures! Each post you share earns you more discounts.
                    </p>
                  </div>
                  
                  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      Rent and Drive LLC • Reno, Nevada
                    </p>
                  </div>
                </div>
              `,
            }],
          }),
        })

        console.log(`[Rewards] Discount code email sent to ${reward.user.email}`)
      } catch (emailError) {
        console.error('[Rewards] Failed to send email:', emailError)
        // Don't fail the approval, just log the error
      }
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: reward.user_id,
      type: 'reward_approved',
      title: 'Your Social Reward is Approved!',
      message: `Your ${reward.platform} post has been approved. Check your email for your discount code!`,
      data: { reward_id: id, discount_code: discountCode },
    })

    return NextResponse.json({ 
      success: true, 
      discount_code: discountCode,
      message: 'Reward approved and discount code sent to user'
    })

  } catch (error) {
    console.error('Error approving reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
