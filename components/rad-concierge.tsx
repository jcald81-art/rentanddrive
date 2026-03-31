'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Send, Loader2, MessageCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

const AGENTS = [
  { id: 'RAD Comms', label: 'Comms', color: '#e63946' },
  { id: 'RAD Pricing', label: 'Pricing', color: '#f4a261' },
  { id: 'RAD Fleet', label: 'Fleet', color: '#2a9d8f' },
  { id: 'RAD Intel', label: 'Intel', color: '#457b9d' },
]

export function RADConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeAgent, setActiveAgent] = useState('RAD Comms')
  const [conversations, setConversations] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentMessages = conversations[activeAgent] || []

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, activeAgent])

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && isOpen) {
      inputRef.current?.focus()
    }
  }, [isExpanded, isOpen])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    // Add user message to conversation
    setConversations(prev => ({
      ...prev,
      [activeAgent]: [...(prev[activeAgent] || []), userMessage],
    }))
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: activeAgent,
          message: userMessage.content,
          conversation_history: currentMessages,
        }),
      })

      const data = await response.json()
      
      const agentMessage: Message = {
        role: 'agent',
        content: data.reply || data.result || 'I\'m having trouble responding right now.',
        timestamp: new Date(),
      }

      setConversations(prev => ({
        ...prev,
        [activeAgent]: [...(prev[activeAgent] || []), userMessage, agentMessage].filter(
          (m, i, arr) => i === 0 || m.timestamp !== arr[i - 1]?.timestamp
        ),
      }))
    } catch {
      const errorMessage: Message = {
        role: 'agent',
        content: 'Sorry, I couldn\'t connect. Please try again.',
        timestamp: new Date(),
      }
      setConversations(prev => ({
        ...prev,
        [activeAgent]: [...(prev[activeAgent] || []), errorMessage],
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const activeAgentConfig = AGENTS.find(a => a.id === activeAgent) || AGENTS[0]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center"
        style={{ backgroundColor: '#e63946' }}
        aria-label="Chat with RAD"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>
    )
  }

  return (
    <div
      className="fixed z-[9999] flex flex-col overflow-hidden"
      style={{
        bottom: '24px',
        right: '24px',
        width: '380px',
        height: isExpanded ? '520px' : '56px',
        maxHeight: 'calc(100vh - 48px)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        background: '#1a1f2e',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'height 0.2s ease',
      }}
    >
      {/* Header - fixed at top, never scrolls */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        style={{
          height: '56px',
          flexShrink: 0,
          background: '#e63946',
          padding: '0 16px',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">{activeAgent}</span>
          <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-white/80 transition-transform",
              !isExpanded && "rotate-180"
            )} 
          />
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
            className="p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Agent Selector Pills */}
          <div 
            className="flex gap-2 px-4 py-2 overflow-x-auto"
            style={{ 
              flexShrink: 0,
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {AGENTS.map(agent => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(agent.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  activeAgent === agent.id 
                    ? "text-white" 
                    : "text-white/60 hover:text-white/80"
                )}
                style={{
                  background: activeAgent === agent.id ? agent.color : 'rgba(255,255,255,0.1)',
                }}
              >
                {agent.label}
              </button>
            ))}
          </div>

          {/* Messages Area - scrollable, fills available space */}
          <div
            className="flex flex-col gap-3"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '16px',
            }}
          >
            {currentMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-white/60">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-white font-bold text-lg"
                  style={{ background: activeAgentConfig.color }}
                >
                  {activeAgentConfig.label[0]}
                </div>
                <p className="text-sm">Ask me anything about RAD rentals.</p>
              </div>
            )}

            {currentMessages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                    background: msg.role === 'user' 
                      ? '#e63946' 
                      : 'rgba(255,255,255,0.08)',
                    color: 'white',
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                    <span className="text-sm text-white/60">{activeAgent} is typing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - fixed at bottom, never scrolls away */}
          <div
            className="flex items-center gap-2"
            style={{
              height: '64px',
              flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: '#0a0f1e',
              padding: '0 12px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '24px',
                padding: '10px 16px',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center transition-opacity disabled:opacity-50"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#e63946',
                flexShrink: 0,
              }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
