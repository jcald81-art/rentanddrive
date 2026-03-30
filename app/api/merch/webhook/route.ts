import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/merch/webhook
 * Webhook for Printful order updates
 * Register at: printful.com → Dashboard → Settings → Webhooks
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  const payload = await req.json()
  const { type, data } = payload

  console.log(`[Printful Webhook] Received event: ${type}`)

  switch (type) {
    case 'package_shipped': {
      const { order, shipment } = data
      
      // Update order status
      await supabase
        .from('merch_orders')
        .update({
          status: 'shipped',
          tracking_number: shipment.tracking_number,
          tracking_url: shipment.tracking_url,
          shipped_at: new Date().toISOString(),
        })
        .eq('printful_order_id', order.id)

      // Get order details for notification
      const { data: orderData } = await supabase
        .from('merch_orders')
        .select('*, profiles:host_id(full_name, email)')
        .eq('printful_order_id', order.id)
        .single()

      // Send customer tracking email (stub)
      /*
      await sendEmail({
        to: orderData.shipping_address.email,
        subject: 'Your order has shipped!',
        template: 'merch_shipped',
        data: {
          trackingNumber: shipment.tracking_number,
          trackingUrl: shipment.tracking_url,
        },
      })
      */

      console.log(`[Printful Webhook] Order ${order.id} shipped with tracking: ${shipment.tracking_number}`)
      break
    }

    case 'order_completed': {
      const { order } = data
      
      await supabase
        .from('merch_orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('printful_order_id', order.id)

      console.log(`[Printful Webhook] Order ${order.id} completed`)
      break
    }

    case 'order_failed': {
      const { order, reason } = data
      
      await supabase
        .from('merch_orders')
        .update({
          status: 'failed',
          failure_reason: reason,
        })
        .eq('printful_order_id', order.id)

      // Notify host of failed order
      const { data: orderData } = await supabase
        .from('merch_orders')
        .select('host_id')
        .eq('printful_order_id', order.id)
        .single()

      if (orderData?.host_id) {
        await supabase.from('notifications').insert({
          user_id: orderData.host_id,
          type: 'merch_order_failed',
          title: 'Merch Order Failed',
          message: `An order failed to process: ${reason}`,
          data: { order_id: order.id, reason },
        })
      }

      console.log(`[Printful Webhook] Order ${order.id} failed: ${reason}`)
      break
    }

    default:
      console.log(`[Printful Webhook] Unhandled event type: ${type}`)
  }

  return NextResponse.json({ received: true })
}
