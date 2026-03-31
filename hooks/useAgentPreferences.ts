'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AgentPreferences {
  enabled: boolean
  frequency: 'low' | 'medium' | 'high'
  mutedAgents: string[]
  lastInteraction: string | null
}

const DEFAULT_PREFERENCES: AgentPreferences = {
  enabled: true,
  frequency: 'medium',
  mutedAgents: [],
  lastInteraction: null,
}

const STORAGE_KEY = 'rad-agent-preferences'

export function useAgentPreferences() {
  const [preferences, setPreferences] = useState<AgentPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
        // Try to load from database
        const { data } = await supabase
          .from('agent_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setPreferences({
            enabled: data.enabled,
            frequency: data.frequency,
            mutedAgents: data.muted_agents || [],
            lastInteraction: data.last_interaction,
          })
        } else {
          // Fall back to localStorage
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            try {
              setPreferences(JSON.parse(stored))
            } catch {
              // Use defaults
            }
          }
        }
      } else {
        // Not logged in, use localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            setPreferences(JSON.parse(stored))
          } catch {
            // Use defaults
          }
        }
      }
      
      setLoading(false)
    }
    
    loadPreferences()
  }, [])

  // Save preferences
  const savePreferences = useCallback(async (newPrefs: Partial<AgentPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)
    
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    
    // If logged in, also save to database
    if (userId) {
      const supabase = createClient()
      await supabase
        .from('agent_preferences')
        .upsert({
          user_id: userId,
          enabled: updated.enabled,
          frequency: updated.frequency,
          muted_agents: updated.mutedAgents,
          last_interaction: updated.lastInteraction,
          updated_at: new Date().toISOString(),
        })
        .select()
    }
  }, [preferences, userId])

  // Toggle agent enabled
  const toggleEnabled = useCallback(() => {
    savePreferences({ enabled: !preferences.enabled })
  }, [preferences.enabled, savePreferences])

  // Mute/unmute specific agent
  const toggleAgentMute = useCallback((agentId: string) => {
    const mutedAgents = preferences.mutedAgents.includes(agentId)
      ? preferences.mutedAgents.filter(id => id !== agentId)
      : [...preferences.mutedAgents, agentId]
    savePreferences({ mutedAgents })
  }, [preferences.mutedAgents, savePreferences])

  // Set frequency
  const setFrequency = useCallback((frequency: 'low' | 'medium' | 'high') => {
    savePreferences({ frequency })
  }, [savePreferences])

  // Record interaction
  const recordInteraction = useCallback(() => {
    savePreferences({ lastInteraction: new Date().toISOString() })
  }, [savePreferences])

  // Check if agent is muted
  const isAgentMuted = useCallback((agentId: string) => {
    return preferences.mutedAgents.includes(agentId)
  }, [preferences.mutedAgents])

  return {
    preferences,
    loading,
    toggleEnabled,
    toggleAgentMute,
    setFrequency,
    recordInteraction,
    isAgentMuted,
  }
}
