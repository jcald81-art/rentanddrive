'use client'

import { useState } from 'react'
import { Settings, X, Volume2, VolumeX, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AGENT_CONFIGS } from '@/lib/agents/agent-configs'
import { useAgentPreferences } from '@/hooks/useAgentPreferences'

interface AgentPreferencesPanelProps {
  onClose: () => void
}

export function AgentPreferencesPanel({ onClose }: AgentPreferencesPanelProps) {
  const {
    preferences,
    toggleEnabled,
    toggleAgentMute,
    setFrequency,
    isAgentMuted,
  } = useAgentPreferences()

  const frequencyOptions = [
    { value: 'low' as const, label: 'Low', description: 'Occasional helpful tips' },
    { value: 'medium' as const, label: 'Medium', description: 'Balanced suggestions' },
    { value: 'high' as const, label: 'High', description: 'Proactive assistance' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#262A24] rounded-2xl shadow-2xl border border-[#3D4A3D] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3D4A3D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D4A2D] flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#C4813A]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#F5F2EC]">Agent Settings</h2>
              <p className="text-xs text-[#9A9589]">Customize your R&D experience</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#9A9589] hover:text-[#F5F2EC]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#1C1F1A]">
            <div className="flex items-center gap-3">
              {preferences.enabled ? (
                <Bell className="w-5 h-5 text-[#4A7C59]" />
              ) : (
                <BellOff className="w-5 h-5 text-[#9A9589]" />
              )}
              <div>
                <Label className="text-[#F5F2EC] font-medium">Proactive Agents</Label>
                <p className="text-xs text-[#9A9589]">
                  {preferences.enabled ? 'Agents will reach out with tips' : 'Agents are silent'}
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={toggleEnabled}
              className="data-[state=checked]:bg-[#4A7C59]"
            />
          </div>

          {/* Frequency Selector */}
          {preferences.enabled && (
            <div className="space-y-3">
              <Label className="text-sm text-[#9A9589]">Notification Frequency</Label>
              <div className="grid grid-cols-3 gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFrequency(option.value)}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      preferences.frequency === option.value
                        ? 'border-[#C4813A] bg-[#C4813A]/10 text-[#F5F2EC]'
                        : 'border-[#3D4A3D] text-[#9A9589] hover:border-[#4A7C59]'
                    )}
                  >
                    <span className="block font-medium text-sm">{option.label}</span>
                    <span className="block text-[10px] mt-1 opacity-70">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Individual Agent Toggles */}
          {preferences.enabled && (
            <div className="space-y-3">
              <Label className="text-sm text-[#9A9589]">Individual Agents</Label>
              <div className="space-y-2">
                {Object.values(AGENT_CONFIGS).map((agent) => {
                  const isMuted = isAgentMuted(agent.id)
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#1C1F1A]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          {agent.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[#F5F2EC]">{agent.name}</span>
                          <span className="block text-[10px] text-[#9A9589]">{agent.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAgentMute(agent.id)}
                        className={cn(
                          'p-2 rounded-full transition-colors',
                          isMuted
                            ? 'bg-[#3D4A3D] text-[#9A9589]'
                            : 'bg-[#4A7C59]/20 text-[#4A7C59]'
                        )}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3D4A3D]">
          <p className="text-[10px] text-center text-[#6B7B6B]">
            Powered by R&D Intelligence
          </p>
        </div>
      </div>
    </div>
  )
}
