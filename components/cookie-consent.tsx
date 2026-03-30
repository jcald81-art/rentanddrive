'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setShowBanner(false)
  }

  const savePreferences = () => {
    const consent = {
      ...preferences,
      necessary: true, // Always required
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('cookie-consent', JSON.stringify(consent))
    setShowBanner(false)
    setShowPreferences(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <div className="container mx-auto max-w-4xl">
        {!showPreferences ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-[#CC0000] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  We use cookies to enhance your experience, analyze traffic, and for marketing purposes. 
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies.{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
                Manage Preferences
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Cookie Preferences</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreferences(false)}>
                Back
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Necessary Cookies</p>
                  <p className="text-xs text-muted-foreground">Required for the platform to function</p>
                </div>
                <span className="text-xs text-muted-foreground">Always On</span>
              </div>

              <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-sm">Analytics Cookies</p>
                  <p className="text-xs text-muted-foreground">Help us improve our platform</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-sm">Marketing Cookies</p>
                  <p className="text-xs text-muted-foreground">Used for targeted advertising</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="h-4 w-4"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={savePreferences}>
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
