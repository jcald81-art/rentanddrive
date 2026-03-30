import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/merch/create-product
 * Create product in host's Printful store
 * Full Printful API docs at developers.printful.com
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { printfulProductId, designFileUrl, retailPrice } = await req.json()

  if (!printfulProductId || !retailPrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Real Printful API call (commented out for stub):
  /*
  const response = await fetch('https://api.printful.com/store/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sync_product: {
        name: `Host ${user.id} - ${printfulProductId}`,
        thumbnail: designFileUrl,
      },
      sync_variants: [
        {
          variant_id: printfulProductId,
          retail_price: retailPrice,
          files: [{ url: designFileUrl }],
        },
      ],
    }),
  })
  const data = await response.json()
  */

  // Stub response
  const productId = `prod_${Date.now()}`
  const previewUrl = `https://printful-preview.example.com/${productId}.png`

  // Save to database
  await supabase.from('merch_products').insert({
    host_id: user.id,
    printful_product_id: printfulProductId,
    design_url: designFileUrl,
    retail_price: retailPrice,
    preview_url: previewUrl,
    active: true,
  })

  return NextResponse.json({
    productId,
    previewUrl,
  })
}
