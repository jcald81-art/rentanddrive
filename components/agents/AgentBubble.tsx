'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { AgentConfig } from '@/lib/agents/agent-configs'
import { cn } from '@/lib/utils'

interface AgentBubbleProps {
  agent: AgentConfig
  preview: string
  onClick: () => void
  onDismiss: () => void
}

export function AgentBubble({ agent, preview, onClick, onDismiss }: AgentBubbleProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      )}
    >
      {/* Message preview bubble */}
      <div
        onClick={onClick}
        className="bg-[#F5F2EC] border border-[#E5E0D5] rounded-2xl rounded-br-sm px-4 py-3 max-w-[280px] cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
      >
        {/* Agent name + avatar row */}
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium"
            style={{ backgroundColor: agent.color, color: agent.textColor }}
          >
            {agent.initials}
          </div>
          <span className="text-xs font-medium text-[#1C1F1A]">
            {agent.name}
          </span>
          <span className="text-[10px] text-[#6B7B6B]">
            {agent.role}
          </span>
        </div>
        
        {/* Preview text */}
        <p className="text-[13px] text-[#1C1F1A] leading-relaxed">
          {preview}
        </p>
        <p className="text-[11px] text-[#C4813A] mt-2 font-medium">
          Tap to reply
        </p>
      </div>

      {/* Bottom row: dismiss + avatar */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="text-[11px] text-[#6B7B6B] hover:text-[#1C1F1A] transition-colors px-2 py-1"
        >
          Dismiss
        </button>
        
        {/* Main avatar button */}
        <div
          onClick={onClick}
          className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer text-sm font-medium border-2 border-[#F5F2EC] shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: agent.color, color: agent.textColor }}
        >
          {agent.initials}
        </div>
      </div>
    </div>
  )
}
