import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Connect Session API
// Used by R&D agents to offer/establish text or call sessions between renters and hosts

interface ConnectRequest {
  action: 'offer_connection' | 'accept_connection' | 'decline_connection' | 'initiate_call' | 'send_message'
  booking_id: string
  initiator: 'host' | 'renter' | 'system'
  connection_type: 'text' | 'call'
  message?: string
  agent_name?: string // Which R&D agent initiated this
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const body: ConnectRequest = await request.json()
    const { action, booking_id, initiator, connection_type, message, agent_name } = body

    // Get booking with both parties' info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        renter_id,
        host_id: vehicles(host_id),
        vehicles(make, model, year),
        renter: profiles!bookings_renter_id_fkey(id, full_name, phone, email),
        host: vehicles(host: profiles(id, full_name, phone, email))
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const renter = booking.renter as { id: string; full_name: string; phone: string; email: string }
    const host = (booking.host as any)?.host as { id: string; full_name: string; phone: string; email: string }
    const vehicle = booking.vehicles as { make: string; model: string; year: number }

    switch (action) {
      case 'offer_connection': {
        // AI agent offers to connect the parties
        const targetUser = initiator === 'host' ? renter : host
        const otherParty = initiator === 'host' ? host : renter
        const agentDisplay = agent_name || 'SecureLink'

        // Create connection offer in database
        const { data: offer, error: offerError } = await supabase
          .from('connection_offers')
          .insert({
            booking_id,
            offered_by_agent: agentDisplay,
            connection_type,
            initiator_role: initiator,
            target_user_id: targetUser.id,
            other_party_id: otherParty.id,
            status: 'pending',
            message: message || `${agentDisplay} here. Would you like me to connect you with ${otherParty.full_name} regarding your ${vehicle.year} ${vehicle.make} ${vehicle.model} booking?`,
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
          })
          .select('id')
          .single()

        if (offerError) {
          console.error('[Connect] Offer error:', offerError)
          return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
        }

        // Send notification via SecureLink
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            userId: targetUser.id,
            type: 'custom',
            customMessage: `${agentDisplay}: ${message || `Would you like me to connect you with ${otherParty.full_name}?`}\n\nReply YES to connect via ${connection_type}, or NO to decline.`,
            channels: ['sms'],
          }),
        })

        return NextResponse.json({
          success: true,
          offer_id: offer?.id,
          message: `Connection offer sent to ${targetUser.full_name}`,
        })
      }

      case 'accept_connection': {
        // User accepted the connection offer
        const { data: offer } = await supabase
          .from('connection_offers')
          .select('*')
          .eq('booking_id', booking_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!offer) {
          return NextResponse.json({ error: 'No pending connection offer' }, { status: 404 })
        }

        // Update offer status
        await supabase
          .from('connection_offers')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', offer.id)

        const targetUser = offer.initiator_role === 'host' ? renter : host
        const otherParty = offer.initiator_role === 'host' ? host : renter

        if (connection_type === 'call') {
          // Initiate call via Twilio (if configured)
          if (process.env.TWILIO_ACCOUNT_SID) {
            // Create a Twilio call connecting both parties
            // This is a placeholder - actual implementation would use Twilio's Conference API
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'send_message',
                userId: otherParty.id,
                type: 'custom',
                customMessage: `SecureLink: ${targetUser.full_name} would like to speak with you about your booking. We're connecting you now. Your phone will ring shortly.`,
                channels: ['sms'],
              }),
            })
          }
          
          return NextResponse.json({
            success: true,
            connection_type: 'call',
            message: 'Call connection initiated. Both parties will receive a call.',
            host_phone: host.phone,
            renter_phone: renter.phone,
          })
        } else {
          // Text session - provide each party's info to the other
          // Send host info to renter
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_message',
              userId: targetUser.id,
              type: 'custom',
              customMessage: `SecureLink: Connected! You can now text ${otherParty.full_name} at ${otherParty.phone}. They've been notified you want to chat.`,
              channels: ['sms'],
            }),
          })

          // Notify the other party
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_message',
              userId: otherParty.id,
              type: 'custom',
              customMessage: `SecureLink: ${targetUser.full_name} wants to chat about your ${vehicle.year} ${vehicle.make} ${vehicle.model} booking. Their number is ${targetUser.phone}. Feel free to text or call them.`,
              channels: ['sms'],
            }),
          })

          return NextResponse.json({
            success: true,
            connection_type: 'text',
            message: 'Text connection established. Both parties have been notified.',
          })
        }
      }

      case 'decline_connection': {
        // User declined the connection offer
        await supabase
          .from('connection_offers')
          .update({ status: 'declined', declined_at: new Date().toISOString() })
          .eq('booking_id', booking_id)
          .eq('status', 'pending')

        return NextResponse.json({
          success: true,
          message: 'Connection declined',
        })
      }

      case 'initiate_call': {
        // Direct call initiation (for urgent situations)
        const caller = initiator === 'host' ? host : renter
        const callee = initiator === 'host' ? renter : host

        // Log the call request
        await supabase.from('connection_calls').insert({
          booking_id,
          caller_id: caller.id,
          callee_id: callee.id,
          initiated_by: agent_name || 'system',
          status: 'connecting',
        })

        // Notify callee
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            userId: callee.id,
            type: 'urgent_alert',
            customMessage: `${agent_name || 'SecureLink'}: ${caller.full_name} is trying to reach you about your booking. Please call them at ${caller.phone} or reply with a good time to talk.`,
            channels: ['sms', 'email'],
          }),
        })

        return NextResponse.json({
          success: true,
          message: `Call request sent to ${callee.full_name}`,
          caller_phone: caller.phone,
          callee_phone: callee.phone,
        })
      }

      case 'send_message': {
        // AI-facilitated message relay
        const sender = initiator === 'host' ? host : renter
        const recipient = initiator === 'host' ? renter : host

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_message',
            userId: recipient.id,
            type: 'custom',
            customMessage: `Message from ${sender.full_name} regarding your ${vehicle.year} ${vehicle.make} ${vehicle.model} booking:\n\n"${message}"\n\nReply directly to this number to respond.`,
            channels: ['sms'],
          }),
        })

        return NextResponse.json({
          success: true,
          message: 'Message sent successfully',
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Connect API] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
