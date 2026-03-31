'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Send, Loader2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RADConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agents/concierge?persona=RAD' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const getMessageText = (message: typeof messages[0]) => {
    if (!message.parts) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  return (
    <>
      {/* RAD Chat Toggle - Expedition Theme */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          'bg-[#2D4A2D] hover:bg-[#4A7C59] text-[#F5F2EC]',
          isOpen && 'rotate-90'
        )}
        aria-label={isOpen ? 'Close chat' : 'Chat with RAD'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window - Expedition Theme */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] shadow-2xl border border-border flex flex-col overflow-hidden bg-card">
          {/* Header - Forest Green */}
          <div className="h-[72px] flex items-center gap-3 bg-[#2D4A2D] px-4 py-3 text-[#F5F2EC]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F2EC]/20 backdrop-blur font-medium text-sm">
              R
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">RAD</h3>
              <p className="text-xs text-[#F5F2EC]/80">Your Rent and Drive guide</p>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" title="Online" />
          </div>

          {/* Messages */}
          <div className="h-[340px] overflow-y-auto p-4 bg-background">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="w-12 h-12 rounded-lg bg-[#2D4A2D] flex items-center justify-center text-[#F5F2EC] font-medium text-lg mb-4">
                  R
                </div>
                <h4 className="font-semibold text-lg mb-2 text-foreground">RAD</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell me where you&apos;re headed — I&apos;ll find you the right vehicle.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'Tahoe this weekend',
                    'AWD vehicles',
                    'How booking works',
                    'Host earnings'
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs border-border hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        sendMessage({ text: suggestion })
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
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
                            ? 'bg-[#2D4A2D] text-[#F5F2EC]'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
                      </div>
                    </div>
                  )
                })}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#2D4A2D]" />
                        <span className="text-sm text-muted-foreground">RAD is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="h-[88px] border-t border-border p-3 bg-card">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about vehicles, routes, or booking..."
                className="flex-1 border-border focus-visible:ring-[#2D4A2D]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-[#2D4A2D] hover:bg-[#4A7C59] text-[#F5F2EC]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Rent and Drive · Reno · Sparks · Tahoe
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
