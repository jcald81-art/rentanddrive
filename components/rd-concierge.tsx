'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Car, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RDConcierge() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agents/concierge' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom on new messages
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

  // Extract text from message parts
  const getMessageText = (message: typeof messages[0]) => {
    if (!message.parts) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  // Check for tool results in message parts
  const getToolResults = (message: typeof messages[0]) => {
    if (!message.parts) return []
    return message.parts.filter((p) => p.type === 'tool-invocation')
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105',
          'bg-[#D62828] hover:bg-[#B82222] text-white',
          isOpen && 'rotate-90'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden shadow-2xl border-0">
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#0D0D0D] px-4 py-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D62828]">
              <Car className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">R&D Concierge</h3>
              <p className="text-xs text-gray-400">Rent and Drive Assistant</p>
            </div>
            <div className="flex h-2 w-2 rounded-full bg-green-500" title="Online" />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D62828]/10 mb-4">
                  <Car className="h-8 w-8 text-[#D62828]" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Welcome to R&D!</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  I&apos;m your personal concierge. I can help you find vehicles, answer questions, or assist with bookings.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    'Find an SUV for Tahoe',
                    'Vehicles with ski racks',
                    'Book an RV',
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        sendMessage({ text: suggestion })
                      }}
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
                const toolResults = getToolResults(message)
                
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
                        'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                        message.role === 'user'
                          ? 'bg-[#D62828] text-white rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {text && <p className="whitespace-pre-wrap">{text}</p>}
                      
                      {/* Render vehicle search results */}
                      {toolResults.map((tool, idx) => {
                        if (tool.type !== 'tool-invocation') return null
                        if (tool.toolInvocation.toolName === 'searchVehicles' && tool.toolInvocation.state === 'output-available') {
                          const result = tool.toolInvocation.output as { vehicles?: Array<{ name: string; dailyRate: number; features: string; bookUrl: string }> }
                          if (result?.vehicles?.length) {
                            return (
                              <div key={idx} className="mt-2 space-y-2">
                                {result.vehicles.map((v, i) => (
                                  <a
                                    key={i}
                                    href={v.bookUrl}
                                    className="block rounded-lg bg-background/50 p-2 hover:bg-background/80 transition-colors"
                                  >
                                    <div className="font-medium">{v.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ${v.dailyRate}/day - {v.features}
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )
                          }
                        }
                        return null
                      })}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>R&D is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask R&D anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-[#D62828] hover:bg-[#B82222]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Book direct and save 10% vs Turo
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
