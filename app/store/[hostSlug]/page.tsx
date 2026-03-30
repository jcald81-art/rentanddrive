'use client'

import { useState, useEffect, use } from 'react'
import { ShoppingCart, X, Plus, Minus, Check, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Product {
  id: string
  name: string
  price: number
  image: string | null
  sizes?: string[]
}

interface CartItem {
  productId: string
  name: string
  price: number
  size?: string
  quantity: number
}

const MOCK_STORE = {
  name: "Mike's Garage Store",
  tagline: 'Quality rides deserve quality gear',
  logo: null,
  productCount: 6,
}

const MOCK_PRODUCTS: Product[] = [
  { id: 'tshirt', name: 'Garage Logo T-Shirt', price: 29.99, image: null, sizes: ['S', 'M', 'L', 'XL', '2XL'] },
  { id: 'hat', name: 'Classic Dad Hat', price: 34.99, image: null },
  { id: 'mug', name: 'Morning Coffee Mug', price: 19.99, image: null },
  { id: 'hoodie', name: 'Cozy Garage Hoodie', price: 59.99, image: null, sizes: ['S', 'M', 'L', 'XL', '2XL'] },
  { id: 'bottle', name: 'Stainless Water Bottle', price: 34.99, image: null },
  { id: 'stickers', name: 'Sticker Pack (5pc)', price: 9.99, image: null },
]

export default function HostStorePage({ params }: { params: Promise<{ hostSlug: string }> }) {
  const { hostSlug } = use(params)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [checkingOut, setCheckingOut] = useState(false)

  const addToCart = (product: Product) => {
    const size = product.sizes ? selectedSizes[product.id] : undefined
    if (product.sizes && !size) return // Require size selection

    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id && i.size === size)
      if (existing) {
        return prev.map(i =>
          i.productId === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, size, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const updateQuantity = (productId: string, size: string | undefined, delta: number) => {
    setCart(prev =>
      prev
        .map(i =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter(i => i.quantity > 0)
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = async () => {
    setCheckingOut(true)
    // Stub: would create Stripe checkout session
    await new Promise(r => setTimeout(r, 1500))
    alert('Checkout integration coming soon!')
    setCheckingOut(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Store Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              {MOCK_STORE.logo ? (
                <img src={MOCK_STORE.logo} alt="Logo" className="h-12 w-12 object-contain" />
              ) : (
                <span className="text-2xl font-bold text-[#FFD84D]">
                  {MOCK_STORE.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{MOCK_STORE.name}</h1>
              {MOCK_STORE.tagline && (
                <p className="text-zinc-400">{MOCK_STORE.tagline}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-400" />
              Verified rentanddrive.net host
            </span>
            <span>{MOCK_STORE.productCount} products</span>
          </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
          {MOCK_PRODUCTS.map(product => (
            <Card key={product.id} className="border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-4xl text-zinc-600">📦</div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="font-mono text-[#FFD84D] mb-3">${product.price.toFixed(2)}</p>
                
                {product.sizes && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                          className={`px-2 py-1 text-xs rounded ${
                            selectedSizes[product.id] === size
                              ? 'bg-[#FFD84D] text-black'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => addToCart(product)}
                  disabled={product.sizes && !selectedSizes[product.id]}
                  className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 disabled:opacity-50"
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD84D] text-black shadow-lg hover:bg-[#FFD84D]/90"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {cartCount}
          </span>
        </button>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Your cart is empty
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 rounded-lg bg-zinc-800 p-3">
                      <div className="h-16 w-16 rounded bg-zinc-700 flex items-center justify-center text-2xl">
                        📦
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        {item.size && <p className="text-sm text-zinc-400">Size: {item.size}</p>}
                        <p className="font-mono text-[#FFD84D]">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, -1)}
                          className="h-8 w-8 rounded bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, 1)}
                          className="h-8 w-8 rounded bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-zinc-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-xl font-mono font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                  >
                    {checkingOut ? 'Processing...' : 'Checkout'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
