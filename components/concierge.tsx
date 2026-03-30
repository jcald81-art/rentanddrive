'use client'

/**
 * Universal Concierge Component
 * Supports both R&D (beta) and RAD (production) personas
 * CLIENT COMPONENT ONLY - NO SERVER IMPORTS ALLOWED
 * Updated: 2026-03-30
 */

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Loader2, Waves, Beaker, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERSONAS, type AIPersona } from '@/lib/ai-personas'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ConciergeProps {
  defaultPersona?: AIPersona
}

export function Concierge({ defaultPersona = 'RAD' }: ConciergeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState<AIPersona>(defaultPersona)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const config = PERSONAS[persona]
  
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: `/api/agents/concierge?persona=${persona}` }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handlePersonaSwitch = (newPersona: AIPersona) => {
    setPersona(newPersona)
    setMessages([]) // Clear chat on persona switch
  }

  const getMessageText = (message: typeof messages[0]) => {
    if (!message.parts) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  const isRAD = persona === 'RAD'
  const primaryColor = isRAD ? '#00B4D8' : '#D62828'
  const secondaryColor = isRAD ? '#0077B6' : '#A31D1D'

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          isOpen && 'rotate-90'
        )}
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : isRAD ? (
          <Waves className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden shadow-2xl border-0">
          {/* Header */}
          <div 
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              {isRAD ? (
                <span className="text-2xl">🏄</span>
              ) : (
                <Beaker className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2">
                {config.name}
                <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
                  {isRAD ? 'Chill Mode' : 'Beta Mode'}
                </span>
              </h3>
              <p className="text-xs text-white/80">{config.tagline}</p>
            </div>
            
            {/* Persona Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handlePersonaSwitch('RAD')}
                  className={cn(persona === 'RAD' && 'bg-[#00B4D8]/10')}
                >
                  <Waves className="h-4 w-4 mr-2 text-[#00B4D8]" />
                  RAD - Chill Mode
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handlePersonaSwitch('R&D')}
                  className={cn(persona === 'R&D' && 'bg-[#D62828]/10')}
                >
                  <Beaker className="h-4 w-4 mr-2 text-[#D62828]" />
                  R&D - Beta Mode
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Messages */}
          <ScrollArea 
            className="flex-1 p-4" 
            ref={scrollRef}
            style={{
              background: `linear-gradient(180deg, ${primaryColor}08, white)`,
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-6xl mb-4">{isRAD ? '🏄‍♂️' : '🔬'}</div>
                <h4 className="font-semibold text-lg mb-2">
                  {isRAD ? "Yo! RAD here!" : "Welcome to R&D!"}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {config.greeting}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {config.quickReplies.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      style={{
                        borderColor: `${primaryColor}30`,
                      }}
                      onClick={() => sendMessage({ text: suggestion })}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((message) => {
                const text = getMessageText(message)
                if (!text) return null
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5',
                        message.role === 'user'
                          ? 'text-white'
                          : 'text-foreground'
                      )}
                      style={{
                        background: message.role === 'user' 
                          ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                          : `${primaryColor}15`,
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap">{text}</p>
                    </div>
                  </div>
                )
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div 
                    className="rounded-2xl px-4 py-3"
                    style={{ background: `${primaryColor}15` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{isRAD ? '🌊' : '⚡'}</span>
                      <span className="text-sm text-muted-foreground">
                        {isRAD ? "Catchin' a wave..." : "Processing..."}
                      </span>
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: primaryColor }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRAD ? "What's up, dude?" : "How can I help?"}
                className="flex-1"
                style={{
                  borderColor: `${primaryColor}30`,
                }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              {isRAD ? 'Hang 10 and drive 55 🤙' : 'Powered by R&D Intelligence'}
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
