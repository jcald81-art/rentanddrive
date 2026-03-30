import { NextResponse } from 'next/server'

/**
 * GET /api/merch/products
 * Fetch Printful product catalog
 * Full Printful API docs at developers.printful.com
 */

// Stubbed Printful products - replace with real API call when ready
const PRINTFUL_PRODUCTS = [
  { id: 'unisex_tshirt', name: 'Unisex Staple T-Shirt', baseCost: 13.25, category: 'apparel', sizes: ['S', 'M', 'L', 'XL', '2XL'] },
  { id: 'dad_hat', name: 'Dad Hat', baseCost: 17.95, category: 'accessories', sizes: null },
  { id: 'coffee_mug', name: '11oz Ceramic Mug', baseCost: 8.95, category: 'drinkware', sizes: null },
  { id: 'pullover_hoodie', name: 'Unisex Pullover Hoodie', baseCost: 31.95, category: 'apparel', sizes: ['S', 'M', 'L', 'XL', '2XL'] },
  { id: 'iphone_case', name: 'iPhone Tough Case', baseCost: 11.95, category: 'accessories', sizes: null },
  { id: 'water_bottle', name: '20oz Stainless Bottle', baseCost: 18.95, category: 'drinkware', sizes: null },
  { id: 'tote_bag', name: 'Cotton Tote Bag', baseCost: 14.95, category: 'accessories', sizes: null },
  { id: 'sticker_sheet', name: 'Kiss-Cut Sticker Sheet', baseCost: 3.95, category: 'stickers', sizes: null },
]

export async function GET() {
  // Real Printful API call (commented out for stub):
  /*
  const response = await fetch('https://api.printful.com/products', {
    headers: {
      'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
    },
  })
  const data = await response.json()
  return NextResponse.json(data.result)
  */

  // Stub response
  return NextResponse.json({
    products: PRINTFUL_PRODUCTS,
    suggestedMarkup: 2.0, // 100% markup suggested
  })
}
