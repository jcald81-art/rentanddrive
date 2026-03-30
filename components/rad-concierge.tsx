'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Send, Loader2, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RADConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agents/concierge?persona=RAD' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when messages change
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
      {/* RAD Chat Toggle - Surfer Wave Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          'bg-gradient-to-br from-[#00B4D8] to-[#0077B6] hover:from-[#0096C7] hover:to-[#005F8A] text-white',
          isOpen && 'rotate-90'
        )}
        aria-label={isOpen ? 'Close chat' : 'Chat with RAD'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Waves className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window - Surfer Theme */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[500px] flex flex-col overflow-hidden shadow-2xl border-0">
          {/* Header - Ocean Gradient - Fixed height */}
          <div className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] px-4 py-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <span className="text-2xl">🏄</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold flex items-center gap-2">
                RAD
                <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
                  Hang 10!
                </span>
              </h3>
              <p className="text-xs text-white/80">Your chill ride concierge</p>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" title="Vibin'" />
          </div>

          {/* Messages - Scrollable area with fixed boundaries */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gradient-to-b from-[#00B4D8]/5 to-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center px-4">
                <div className="text-6xl mb-4">🏄‍♂️</div>
                <h4 className="font-semibold text-lg mb-2">Yo! RAD here!</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  What&apos;s up, dude? I&apos;m your chill ride concierge. Let&apos;s find you something sweet to cruise in!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'Hook me up with a ride',
                    'What deals you got?',
                    'Need a Tahoe cruiser',
                    'Show me the vibes'
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs border-[#00B4D8]/30 hover:bg-[#00B4D8]/10 hover:text-[#0077B6]"
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
                            ? 'bg-gradient-to-br from-[#00B4D8] to-[#0077B6] text-white'
                            : 'bg-[#0077B6]/10 text-foreground'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
                      </div>
                    </div>
                  )
                })}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#0077B6]/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌊</span>
                        <span className="text-sm text-muted-foreground">Catchin&apos; a wave...</span>
                        <Loader2 className="h-4 w-4 animate-spin text-[#00B4D8]" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input - Fixed at bottom */}
          <form onSubmit={handleSubmit} className="flex-shrink-0 border-t p-3 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What's up, dude?"
                className="flex-1 border-[#00B4D8]/30 focus-visible:ring-[#00B4D8]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 bg-gradient-to-br from-[#00B4D8] to-[#0077B6] hover:from-[#0096C7] hover:to-[#005F8A]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Hang 10 and drive 55 🤙
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
