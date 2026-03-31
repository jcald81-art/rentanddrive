'use client'

/**
 * Universal Concierge Component
 * CLIENT COMPONENT ONLY - NO SERVER IMPORTS
 */

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Loader2, Waves, Beaker, Settings, PauseCircle, PlayCircle, Clock, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERSONAS, type AIPersona } from '@/lib/ai-personas'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

interface ConciergeProps {
  defaultPersona?: AIPersona
}

type PauseStatus = 'active' | 'paused-1hr' | 'paused-session' | 'paused-permanent'

export function Concierge({ defaultPersona = 'RAD' }: ConciergeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true) // Start minimized by default
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState<AIPersona>(defaultPersona)
  const [pauseStatus, setPauseStatus] = useState<PauseStatus>('active')
  const [pauseExpiry, setPauseExpiry] = useState<Date | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const config = PERSONAS[persona]

  // Load pause status from localStorage on mount
  useEffect(() => {
    const savedPause = localStorage.getItem('concierge-pause')
    if (savedPause) {
      const { status, expiry } = JSON.parse(savedPause)
      if (status === 'paused-permanent') {
        setPauseStatus('paused-permanent')
      } else if (status === 'paused-session') {
        setPauseStatus('paused-session')
      } else if (status === 'paused-1hr' && expiry) {
        const expiryDate = new Date(expiry)
        if (expiryDate > new Date()) {
          setPauseStatus('paused-1hr')
          setPauseExpiry(expiryDate)
        } else {
          localStorage.removeItem('concierge-pause')
        }
      }
    }
  }, [])

  // Listen for 'open-concierge' event from Ask RAD button in navbar
  useEffect(() => {
    const handleOpenConcierge = () => {
      setIsMinimized(false)
      setIsOpen(true)
      if (pauseStatus !== 'active') {
        handleResume()
      }
    }
    window.addEventListener('open-concierge', handleOpenConcierge)
    return () => window.removeEventListener('open-concierge', handleOpenConcierge)
  }, [pauseStatus])

  // Check for pause expiry
  useEffect(() => {
    if (pauseStatus === 'paused-1hr' && pauseExpiry) {
      const interval = setInterval(() => {
        if (new Date() >= pauseExpiry) {
          setPauseStatus('active')
          setPauseExpiry(null)
          localStorage.removeItem('concierge-pause')
        }
      }, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [pauseStatus, pauseExpiry])

  const handlePause = (duration: '1hr' | 'session' | 'permanent') => {
    if (duration === '1hr') {
      const expiry = new Date(Date.now() + 60 * 60 * 1000)
      setPauseStatus('paused-1hr')
      setPauseExpiry(expiry)
      localStorage.setItem('concierge-pause', JSON.stringify({ status: 'paused-1hr', expiry: expiry.toISOString() }))
    } else if (duration === 'session') {
      setPauseStatus('paused-session')
      localStorage.setItem('concierge-pause', JSON.stringify({ status: 'paused-session' }))
    } else {
      setPauseStatus('paused-permanent')
      localStorage.setItem('concierge-pause', JSON.stringify({ status: 'paused-permanent' }))
    }
    setIsOpen(false)
  }

  const handleResume = () => {
    setPauseStatus('active')
    setPauseExpiry(null)
    localStorage.removeItem('concierge-pause')
  }

  const isPaused = pauseStatus !== 'active'
  
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
    setMessages([])
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

  // If permanently paused, don't show anything
  if (pauseStatus === 'paused-permanent') {
    return null
  }

  return (
    <>
      {/* Minimized "Need help?" trigger */}
      {isMinimized && !isOpen && !isPaused && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-all border border-gray-200 text-sm font-medium"
        >
          <MessageCircle className="h-4 w-4" style={{ color: primaryColor }} />
          Need help?
        </button>
      )}

      {/* Paused indicator with resume option */}
      {isPaused && pauseStatus !== 'paused-permanent' && (
        <button
          onClick={handleResume}
          className="fixed bottom-6 right-6 z-50 bg-gray-100 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-all border border-gray-200 text-sm text-muted-foreground"
        >
          <PlayCircle className="h-4 w-4" />
          Resume AI Assistant
          {pauseStatus === 'paused-1hr' && pauseExpiry && (
            <span className="text-xs">
              ({Math.ceil((pauseExpiry.getTime() - Date.now()) / 60000)}m left)
            </span>
          )}
        </button>
      )}

      {/* Main chat button */}
      {!isMinimized && !isPaused && (
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
      )}

      {isOpen && !isMinimized && !isPaused && (
        <Card className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden shadow-2xl border-0">
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
                  {isRAD ? 'Standard' : 'Beta'}
                </span>
              </h3>
              <p className="text-xs text-white/80">{config.tagline}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Assistant Mode</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handlePersonaSwitch('RAD')}
                  className={cn(persona === 'RAD' && 'bg-[#00B4D8]/10')}
                >
                  <Waves className="h-4 w-4 mr-2 text-[#00B4D8]" />
                  RAD - Standard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handlePersonaSwitch('R&D')}
                  className={cn(persona === 'R&D' && 'bg-[#D62828]/10')}
                >
                  <Beaker className="h-4 w-4 mr-2 text-[#D62828]" />
                  R&D - Beta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Pause Assistant</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handlePause('1hr')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Pause for 1 hour
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePause('session')}>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Pause this session
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handlePause('permanent')}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Disable permanently
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsMinimized(true)}>
                  <X className="h-4 w-4 mr-2" />
                  Minimize
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          <ScrollArea 
            className="flex-1 p-4" 
            ref={scrollRef}
            style={{
              background: `linear-gradient(180deg, ${primaryColor}08, white)`,
            }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-5xl mb-4">{isRAD ? '🚗' : '🔬'}</div>
                <h4 className="font-semibold text-lg mb-2">
                  {isRAD ? "Hey, I'm RAD" : "Welcome to R&D"}
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
                      <span className="text-lg">{isRAD ? '🔍' : '⚡'}</span>
                      <span className="text-sm text-muted-foreground">
                        {isRAD ? "Searching..." : "Processing..."}
                      </span>
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: primaryColor }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRAD ? "Ask me anything..." : "How can I help?"}
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
              Powered by R&D Intelligence
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
