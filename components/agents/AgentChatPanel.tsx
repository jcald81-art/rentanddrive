'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { AgentConfig } from '@/lib/agents/agent-configs'
import { ActionButton } from '@/lib/agents/proactive-messages'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'agent' | 'user'
  content: string
  timestamp: Date
  action_buttons?: ActionButton[]
}

interface AgentChatPanelProps {
  agent: AgentConfig
  initialMessage: string
  context: Record<string, unknown>
  actionButtons?: ActionButton[]
  onClose: () => void
}

export function AgentChatPanel({ 
  agent, 
  initialMessage, 
  context, 
  actionButtons,
  onClose 
}: AgentChatPanelProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: initialMessage,
      timestamp: new Date(),
      action_buttons: actionButtons,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    await sendMessage(input.trim())
  }

  async function sendMessage(text: string) {
    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: agent.task_type,
          message: text,
          context: {
            ...context,
            conversation_history: messages.map(m => ({
              role: m.role === 'agent' ? 'assistant' : 'user',
              content: m.content,
            }))
          },
          stream: false,
        })
      })
      
      const result = await response.json()
      setMessages(prev => [...prev, {
        role: 'agent',
        content: result.result || result.error || 'I\'m having trouble responding right now.',
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Sorry, I couldn\'t connect. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleActionButton(button: ActionButton) {
    if (button.action.startsWith('/') || button.action.startsWith('?')) {
      router.push(button.action)
      onClose()
    } else if (button.action === 'dismiss' || button.action === 'continue') {
      onClose()
    } else {
      // Send as message
      sendMessage(button.label)
    }
  }

  return (
    <div 
      className="fixed bottom-6 right-6 w-[360px] h-[520px] z-50 bg-[#F5F2EC] border border-[#E5E0D5] rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E5E0D5] flex items-center gap-3">
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: agent.color, color: agent.textColor }}
        >
          {agent.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#1C1F1A]">
            {agent.name}
          </div>
          <div className="text-[11px] text-[#6B7B6B]">
            {agent.role} · RAD AI
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 text-[#6B7B6B] hover:text-[#1C1F1A] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5',
                msg.role === 'agent' 
                  ? 'bg-card text-card-foreground rounded-bl-sm' 
                  : 'bg-primary text-primary-foreground ml-auto rounded-br-sm'
              )}
            >
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
            
            {/* Action buttons */}
            {msg.action_buttons && msg.action_buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.action_buttons.map((button, j) => (
                  <Button
                    key={j}
                    variant={button.variant === 'primary' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleActionButton(button)}
                    className={cn(
                      'text-xs h-8 rounded-full',
                      button.variant === 'primary' 
                        ? 'bg-primary hover:bg-primary/80 text-primary-foreground'
                        : 'border-accent text-accent hover:bg-accent/10'
                    )}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-[#6B7B6B]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">{agent.name} is typing...</span>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 bg-card border-border text-card-foreground placeholder:text-muted-foreground text-sm rounded-full"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || loading}
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
