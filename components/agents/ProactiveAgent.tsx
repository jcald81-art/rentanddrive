'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getProactiveMessage, ProactiveMessage, UserProfile, AgentPreferences } from '@/lib/agents/proactive-messages'
import { AgentChatPanel } from './AgentChatPanel'
import { AgentBubble } from './AgentBubble'

export function ProactiveAgent() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<AgentPreferences | null>(null)
  const [message, setMessage] = useState<ProactiveMessage | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPathnameRef = useRef<string>('')

  // Fetch user data
  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email })
        
        // Fetch profile
        supabase
          .from('profiles')
          .select('id, first_name, role, total_trips, loyalty_tier, fleet_count')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setProfile(profileData as UserProfile)
            }
          })
        
        // Fetch agent preferences
        supabase
          .from('agent_preferences')
          .select('proactive_messages, message_delay_seconds, preferred_agent')
          .eq('user_id', data.user.id)
          .single()
          .then(({ data: prefsData }) => {
            if (prefsData) {
              setPreferences(prefsData as AgentPreferences)
            } else {
              // Default preferences
              setPreferences({
                proactive_messages: true,
                message_delay_seconds: 15,
              })
            }
          })
      }
    })
  }, [])

  const triggerProactiveMessage = useCallback(async () => {
    if (!user) return
    if (preferences?.proactive_messages === false) return
    
    const msg = await getProactiveMessage({
      pathname,
      user,
      profile,
      preferences,
    })
    
    if (msg) {
      setMessage(msg)
    }
  }, [pathname, user, profile, preferences])

  // Handle page changes and trigger proactive messages
  useEffect(() => {
    // Skip if same pathname
    if (pathname === lastPathnameRef.current) return
    lastPathnameRef.current = pathname
    
    // Reset state on page change
    setMessage(null)
    setDismissed(false)
    setPanelOpen(false)
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    
    // Don't show if user not signed in
    if (!user) return
    
    // Don't show if user disabled proactive messages
    if (preferences?.proactive_messages === false) return
    
    // Get delay from preferences (default 15s, user can set 5s-60s)
    const delay = (preferences?.message_delay_seconds ?? 15) * 1000
    
    timerRef.current = setTimeout(() => {
      triggerProactiveMessage()
    }, delay)
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [pathname, user, preferences, triggerProactiveMessage])

  // Don't render if no message, dismissed, or panel is open
  if (!message || dismissed) return null

  return (
    <>
      {/* Floating agent bubble — bottom right */}
      {!panelOpen && (
        <AgentBubble
          agent={message.agent}
          preview={message.preview_text}
          onClick={() => setPanelOpen(true)}
          onDismiss={() => setDismissed(true)}
        />
      )}
      
      {/* Full chat panel — slides up from bottom right */}
      {panelOpen && (
        <AgentChatPanel
          agent={message.agent}
          initialMessage={message.full_message}
          context={message.context}
          actionButtons={message.action_buttons}
          onClose={() => {
            setPanelOpen(false)
            setDismissed(true)
          }}
        />
      )}
    </>
  )
}
