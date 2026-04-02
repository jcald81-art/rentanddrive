'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { MFAEnrollment } from '@/components/mfa-enrollment'

const MFA_PROMPT_DISMISSED_KEY = 'rad_mfa_prompt_dismissed_until'
const MFA_PROMPT_DISMISS_COUNT_KEY = 'rad_mfa_prompt_dismiss_count'
const MAX_DISMISSALS = 3

export function MFAHostPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dismissCount, setDismissCount] = useState(0)
  const [forceShow, setForceShow] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    const supabase = createClient()
    
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Check if user is a host
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_host')
        .eq('id', user.id)
        .single()
      
      if (!profile?.is_host) {
        setLoading(false)
        return
      }

      // Check MFA status
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasVerifiedMFA = factors?.totp?.some(f => f.status === 'verified') || false

      if (hasVerifiedMFA) {
        setLoading(false)
        return
      }

      // Get dismissal count
      const savedDismissCount = parseInt(localStorage.getItem(MFA_PROMPT_DISMISS_COUNT_KEY) || '0', 10)
      setDismissCount(savedDismissCount)

      // If user has dismissed 3+ times, force them to enable MFA
      if (savedDismissCount >= MAX_DISMISSALS) {
        setForceShow(true)
        setShowPrompt(true)
        setLoading(false)
        return
      }

      // Check if dismissed recently
      const dismissedUntil = localStorage.getItem(MFA_PROMPT_DISMISSED_KEY)
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil)
        if (dismissedDate > new Date()) {
          setLoading(false)
          return
        }
      }

      // Show prompt
      setShowPrompt(true)
    } catch (error) {
      console.error('Error checking MFA status:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    if (forceShow) {
      // Can't dismiss if forced
      return
    }
    
    const newCount = dismissCount + 1
    setDismissCount(newCount)
    localStorage.setItem(MFA_PROMPT_DISMISS_COUNT_KEY, newCount.toString())
    
    setShowPrompt(false)
    
    // Remind again based on count - shorter intervals as dismissals increase
    const remindDate = new Date()
    if (newCount === 1) {
      remindDate.setDate(remindDate.getDate() + 7) // 7 days after 1st dismiss
    } else if (newCount === 2) {
      remindDate.setDate(remindDate.getDate() + 3) // 3 days after 2nd dismiss  
    } else {
      remindDate.setDate(remindDate.getDate() + 1) // 1 day after 3rd dismiss
    }
    localStorage.setItem(MFA_PROMPT_DISMISSED_KEY, remindDate.toISOString())
  }

  function handleSetupComplete() {
    setShowPrompt(false)
    setShowSetup(false)
    setForceShow(false)
    // Clear dismissal state
    localStorage.removeItem(MFA_PROMPT_DISMISSED_KEY)
    localStorage.removeItem(MFA_PROMPT_DISMISS_COUNT_KEY)
  }

  if (loading || !showPrompt) {
    return null
  }

  const remainingDismissals = MAX_DISMISSALS - dismissCount

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => {
      // Only allow closing if not forced
      if (!forceShow) {
        setShowPrompt(open)
      }
    }}>
      <DialogContent className="sm:max-w-md bg-[#0f0f0f] border-white/10" onPointerDownOutside={(e) => {
        if (forceShow) e.preventDefault()
      }}>
        {!showSetup ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  forceShow 
                    ? 'bg-[#e22c2c]/20' 
                    : 'bg-[#e22c2c]/20'
                }`}>
                  {forceShow ? (
                    <ShieldAlert className="h-7 w-7 text-[#e22c2c]" />
                  ) : (
                    <Shield className="h-7 w-7 text-[#e22c2c]" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl text-white">
                    {forceShow ? 'MFA Required to Continue' : 'Secure Your Account with 2FA'}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {forceShow 
                      ? 'You must enable MFA to access your dashboard'
                      : 'Enable two-factor authentication now to protect your fleet and earnings.'
                    }
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {forceShow && (
                <div className="p-3 bg-[#e22c2c]/10 border border-[#e22c2c]/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-[#e22c2c] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#e22c2c] font-medium">Action Required</p>
                    <p className="text-xs text-gray-400 mt-1">
                      You&apos;ve skipped MFA setup {MAX_DISMISSALS} times. For the security of your fleet and earnings, MFA is now required.
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-400">
                Two-factor authentication adds an extra layer of security to your account.
                Even if someone gets your password, they won&apos;t be able to access your
                account without your phone.
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-[#e22c2c]" />
                  <span>Protect your vehicle listings</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-[#e22c2c]" />
                  <span>Secure your earnings and payouts</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-[#e22c2c]" />
                  <span>Takes only 30 seconds to set up</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setShowSetup(true)}
                className="bg-[#e22c2c] hover:bg-[#c52525] text-white font-medium h-12"
              >
                <Shield className="h-5 w-5 mr-2" />
                Enable MFA Now
              </Button>
              
              {!forceShow && (
                <Button 
                  variant="ghost" 
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Remind Me Later
                  {remainingDismissals > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs border-gray-600 text-gray-500">
                      {remainingDismissals} {remainingDismissals === 1 ? 'skip' : 'skips'} left
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="py-2">
            <MFAEnrollment 
              showAsCard={false} 
              onClose={handleSetupComplete}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
