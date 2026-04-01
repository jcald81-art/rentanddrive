'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MFAPromptDialog } from '@/components/mfa-enrollment'

const MFA_PROMPT_DISMISSED_KEY = 'rad_mfa_prompt_dismissed_until'

export function MFAHostPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(true)

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
    setShowPrompt(false)
    // Remind again in 7 days
    const remindDate = new Date()
    remindDate.setDate(remindDate.getDate() + 7)
    localStorage.setItem(MFA_PROMPT_DISMISSED_KEY, remindDate.toISOString())
  }

  function handleSetupComplete() {
    setShowPrompt(false)
    // Clear dismissal state
    localStorage.removeItem(MFA_PROMPT_DISMISSED_KEY)
  }

  if (loading || !showPrompt) {
    return null
  }

  return (
    <MFAPromptDialog
      open={showPrompt}
      onOpenChange={setShowPrompt}
      onDismiss={handleDismiss}
      onSetupComplete={handleSetupComplete}
    />
  )
}
