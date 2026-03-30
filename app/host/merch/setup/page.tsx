'use client'

import { useState } from 'react'
import { Upload, Check, Copy, Share2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

const PRODUCTS = [
  { id: 'tshirt', name: 'Unisex T-Shirt', icon: '👕', baseCost: 13.25, suggestedRetail: 29.99 },
  { id: 'hat', name: 'Dad Hat', icon: '🧢', baseCost: 17.95, suggestedRetail: 34.99 },
  { id: 'mug', name: 'Coffee Mug', icon: '☕', baseCost: 8.95, suggestedRetail: 19.99 },
  { id: 'hoodie', name: 'Hoodie', icon: '🎽', baseCost: 31.95, suggestedRetail: 59.99 },
  { id: 'phonecase', name: 'Phone Case', icon: '📱', baseCost: 11.95, suggestedRetail: 24.99 },
  { id: 'bottle', name: 'Water Bottle', icon: '🧴', baseCost: 18.95, suggestedRetail: 34.99 },
  { id: 'tote', name: 'Tote Bag', icon: '🌂', baseCost: 14.95, suggestedRetail: 26.99 },
  { id: 'stickers', name: 'Sticker Pack', icon: '📋', baseCost: 3.95, suggestedRetail: 9.99 },
]

const BRAND_COLORS = ['#FFD84D', '#CC0000', '#3B82F6', '#10B981', '#8B5CF6', '#F97316']

export default function MerchSetupPage() {
  const [step, setStep] = useState(1)
  const [storeName, setStoreName] = useState("John's Garage Store")
  const [tagline, setTagline] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState('#FFD84D')
  const [customColor, setCustomColor] = useState('')
  const [activeProducts, setActiveProducts] = useState<Record<string, boolean>>({})
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [copied, setCopied] = useState(false)
  const [launching, setLaunching] = useState(false)

  const hostSlug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setLogo(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const toggleProduct = (productId: string) => {
    setActiveProducts(prev => ({ ...prev, [productId]: !prev[productId] }))
    if (!prices[productId]) {
      const product = PRODUCTS.find(p => p.id === productId)
      if (product) setPrices(prev => ({ ...prev, [productId]: product.suggestedRetail }))
    }
  }

  const applyAllSuggested = () => {
    const newPrices: Record<string, number> = {}
    PRODUCTS.forEach(p => {
      if (activeProducts[p.id]) newPrices[p.id] = p.suggestedRetail
    })
    setPrices(newPrices)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`https://rentanddrive.net/store/${hostSlug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const launchStore = async () => {
    setLaunching(true)
    // Stub: would call API to create store
    await new Promise(r => setTimeout(r, 1500))
    setLaunching(false)
    setStep(5) // Success state
  }

  const activeCount = Object.values(activeProducts).filter(Boolean).length

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  step >= s ? 'bg-[#FFD84D] text-black' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Brand</span>
            <span>Products</span>
            <span>Pricing</span>
            <span>Launch</span>
          </div>
        </div>

        {/* Step 1: Brand Setup */}
        {step === 1 && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-2xl">Set Up Your Brand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Store Name</Label>
                <Input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Tagline (optional)</Label>
                <Textarea
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="Quality rides, quality gear"
                  className="mt-1 bg-zinc-800 border-zinc-700"
                />
              </div>
              <div>
                <Label>Logo</Label>
                <div
                  className="mt-1 flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 hover:border-[#FFD84D] transition-colors"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {logo ? (
                    <img src={logo} alt="Logo" className="h-32 w-32 object-contain" />
                  ) : (
                    <div className="text-center text-zinc-500">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <p>Click to upload logo</p>
                    </div>
                  )}
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <div>
                <Label>Brand Color</Label>
                <div className="mt-2 flex gap-3 flex-wrap">
                  {BRAND_COLORS.map(color => (
                    <button
                      key={color}
                      className={`h-10 w-10 rounded-full border-2 ${
                        brandColor === color ? 'border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBrandColor(color)}
                    />
                  ))}
                  <Input
                    type="text"
                    placeholder="#RRGGBB"
                    value={customColor}
                    onChange={e => {
                      setCustomColor(e.target.value)
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                        setBrandColor(e.target.value)
                      }
                    }}
                    className="w-24 bg-zinc-800 border-zinc-700"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label>Preview</Label>
                <div className="mt-2 flex justify-center rounded-lg bg-zinc-800 p-8">
                  <div className="relative h-48 w-40">
                    <div className="absolute inset-0 rounded bg-zinc-700" />
                    <div
                      className="absolute inset-x-4 top-8 bottom-16 rounded flex items-center justify-center"
                      style={{ backgroundColor: brandColor }}
                    >
                      {logo ? (
                        <img src={logo} alt="Logo" className="h-16 w-16 object-contain" />
                      ) : (
                        <span className="text-black text-xs font-bold">YOUR LOGO</span>
                      )}
                    </div>
                    <p className="absolute bottom-2 inset-x-0 text-center text-xs text-zinc-400">
                      T-Shirt Preview
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
              >
                Continue to Products
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Product Selection */}
        {step === 2 && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-2xl">Select Your Products</CardTitle>
              <p className="text-zinc-400">Choose which items to sell in your store</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {PRODUCTS.map(product => {
                  const profit = product.suggestedRetail - product.baseCost
                  const margin = Math.round((profit / product.suggestedRetail) * 100)
                  return (
                    <div
                      key={product.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        activeProducts[product.id]
                          ? 'border-[#FFD84D] bg-[#FFD84D]/10'
                          : 'border-zinc-700 bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{product.icon}</span>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-zinc-400">
                              Cost: ${product.baseCost.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={activeProducts[product.id] || false}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Suggested: ${product.suggestedRetail.toFixed(2)}
                        </span>
                        <span className="text-green-400">{margin}% margin</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-zinc-700"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={activeCount === 0}
                  className="flex-1 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  Continue with {activeCount} products
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Set Your Prices</CardTitle>
                  <p className="text-zinc-400">Platform takes 20% of profit</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyAllSuggested}
                  className="border-zinc-700"
                >
                  Apply Suggested Prices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PRODUCTS.filter(p => activeProducts[p.id]).map(product => {
                  const retail = prices[product.id] || product.suggestedRetail
                  const profit = retail - product.baseCost
                  const platformCut = profit * 0.2
                  const hostProfit = profit * 0.8
                  return (
                    <div key={product.id} className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{product.icon}</span>
                          <span className="font-semibold">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={retail}
                            onChange={e => setPrices(prev => ({
                              ...prev,
                              [product.id]: parseFloat(e.target.value) || 0
                            }))}
                            className="w-24 bg-zinc-900 border-zinc-600 text-right font-mono"
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Your Cost</p>
                          <p className="font-mono text-zinc-300">${product.baseCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Platform (20%)</p>
                          <p className="font-mono text-zinc-300">${platformCut.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Your Profit</p>
                          <p className="font-mono text-green-400">${hostProfit.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-zinc-700"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  Review & Launch
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Launch */}
        {step === 4 && (
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-2xl">Launch Your Store</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-zinc-800 p-4">
                <p className="text-sm text-zinc-400 mb-2">Your store will be live at:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-zinc-900 px-3 py-2 font-mono text-[#FFD84D]">
                    rentanddrive.net/store/{hostSlug}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    className="border-zinc-700"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-3">Share on social:</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-zinc-700">
                    <Share2 className="mr-2 h-4 w-4" /> Twitter
                  </Button>
                  <Button variant="outline" className="border-zinc-700">
                    <Share2 className="mr-2 h-4 w-4" /> Facebook
                  </Button>
                  <Button variant="outline" className="border-zinc-700">
                    <Share2 className="mr-2 h-4 w-4" /> Instagram
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                <h4 className="font-semibold mb-2">Store Summary</h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>Store Name: {storeName}</li>
                  <li>Products: {activeCount}</li>
                  <li>Brand Color: {brandColor}</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-zinc-700"
                >
                  Back
                </Button>
                <Button
                  onClick={launchStore}
                  disabled={launching}
                  className="flex-1 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  {launching ? 'Launching...' : 'Launch Store'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <Card className="border-zinc-800 bg-zinc-900 text-center">
            <CardContent className="py-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Your Store is Live!</h2>
              <p className="text-zinc-400 mb-6">
                Start sharing your link and earning from merch sales
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="border-zinc-700"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  asChild
                  className="bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
                >
                  <a href={`/store/${hostSlug}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Store
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
