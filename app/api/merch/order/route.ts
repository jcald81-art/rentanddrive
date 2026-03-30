import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/merch/order
 * Place merch order via Printful
 * 
 * REVENUE MODEL:
 * - Printful base cost: paid by platform on each order
 * - Host retail price: collected via Stripe on checkout
 * - Platform takes 20% of (retail - base cost)
 * - Host receives 80% of profit
 * - Example: $29.99 shirt, $13.25 Printful cost = $16.74 profit
 *   - Host gets: $13.39
 *   - Platform gets: $3.35 per shirt sold
 */

interface CartItem {
  productId: string
  name: string
  price: number
  size?: string
  quantity: number
  baseCost: number
}

interface ShippingAddress {
  name: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  
  const { hostSlug, cartItems, shippingAddress } = await req.json() as {
    hostSlug: string
    cartItems: CartItem[]
    shippingAddress: ShippingAddress
  }

  if (!hostSlug || !cartItems?.length || !shippingAddress) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Calculate totals
  let subtotal = 0
  let totalBaseCost = 0
  let platformFee = 0
  let hostEarnings = 0

  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity
    const itemBaseCost = (item.baseCost || item.price * 0.4) * item.quantity // Estimate base cost if not provided
    const itemProfit = itemTotal - itemBaseCost
    
    subtotal += itemTotal
    totalBaseCost += itemBaseCost
    platformFee += itemProfit * 0.2 // 20% of profit
    hostEarnings += itemProfit * 0.8 // 80% of profit
  }

  const shipping = 4.99 // Flat rate shipping
  const total = subtotal + shipping

  // Real Printful API call (commented out for stub):
  /*
  const printfulResponse = await fetch('https://api.printful.com/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: {
        name: shippingAddress.name,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state_code: shippingAddress.state,
        zip: shippingAddress.zip,
        country_code: shippingAddress.country,
      },
      items: cartItems.map(item => ({
        sync_variant_id: item.productId,
        quantity: item.quantity,
      })),
    }),
  })
  const printfulData = await printfulResponse.json()
  const printfulOrderId = printfulData.result.id
  */

  // Stub
  const orderId = `ord_${Date.now()}`
  const printfulOrderId = `pf_${Date.now()}`

  // Get host by slug
  const { data: host } = await supabase
    .from('profiles')
    .select('id')
    .eq('store_slug', hostSlug)
    .single()

  // Save order to database
  await supabase.from('merch_orders').insert({
    order_id: orderId,
    host_id: host?.id,
    printful_order_id: printfulOrderId,
    items: cartItems,
    subtotal,
    shipping,
    total,
    platform_fee: platformFee,
    host_earnings: hostEarnings,
    shipping_address: shippingAddress,
    status: 'processing',
  })

  // Calculate estimated delivery (5-7 business days)
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 7)

  return NextResponse.json({
    orderId,
    printfulOrderId,
    total,
    hostEarnings,
    platformFee,
    estimatedDelivery: deliveryDate.toISOString().split('T')[0],
  })
}
