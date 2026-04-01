'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const MFA_PROMPT_DISMISSED_KEY = 'rad_mfa_prompt_dismissed'
const MFA_PROMPT_DISMISSED_UNTIL_KEY = 'rad_mfa_prompt_dismissed_until'

export function useMFAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  async function checkMFAStatus() {
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
      
      const userIsHost = profile?.is_host || false
      setIsHost(userIsHost)

      // Check MFA status
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasVerifiedMFA = factors?.totp?.some(f => f.status === 'verified') || false
      setMfaEnabled(hasVerifiedMFA)

      // Only show prompt for hosts without MFA who haven't dismissed it recently
      if (userIsHost && !hasVerifiedMFA) {
        const dismissedUntil = localStorage.getItem(MFA_PROMPT_DISMISSED_UNTIL_KEY)
        if (dismissedUntil) {
          const dismissedDate = new Date(dismissedUntil)
          if (dismissedDate > new Date()) {
            // Still within dismissal period
            setShowPrompt(false)
          } else {
            // Dismissal period expired, show again
            setShowPrompt(true)
          }
        } else {
          // Never dismissed, show prompt
          setShowPrompt(true)
        }
      }
    } catch (error) {
      console.error('Error checking MFA status:', error)
    } finally {
      setLoading(false)
    }
  }

  function dismissPrompt(remindLater = true) {
    setShowPrompt(false)
    
    if (remindLater) {
      // Remind again in 7 days
      const remindDate = new Date()
      remindDate.setDate(remindDate.getDate() + 7)
      localStorage.setItem(MFA_PROMPT_DISMISSED_UNTIL_KEY, remindDate.toISOString())
    } else {
      // Don't remind for 30 days
      const remindDate = new Date()
      remindDate.setDate(remindDate.getDate() + 30)
      localStorage.setItem(MFA_PROMPT_DISMISSED_UNTIL_KEY, remindDate.toISOString())
    }
  }

  function permanentlyDismiss() {
    setShowPrompt(false)
    localStorage.setItem(MFA_PROMPT_DISMISSED_KEY, 'true')
    // Set to far future date
    const farFuture = new Date('2099-12-31')
    localStorage.setItem(MFA_PROMPT_DISMISSED_UNTIL_KEY, farFuture.toISOString())
  }

  function onMFAEnabled() {
    setMfaEnabled(true)
    setShowPrompt(false)
    // Clear any dismissal state
    localStorage.removeItem(MFA_PROMPT_DISMISSED_KEY)
    localStorage.removeItem(MFA_PROMPT_DISMISSED_UNTIL_KEY)
  }

  return {
    showPrompt,
    isHost,
    mfaEnabled,
    loading,
    dismissPrompt,
    permanentlyDismiss,
    onMFAEnabled,
    checkMFAStatus,
  }
}
