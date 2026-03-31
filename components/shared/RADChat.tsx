"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  ts: Date
}

interface RADContext {
  isLoggedIn: boolean
  page: string
  renterProfile: { first_name?: string } | null
  upcomingBookings: Array<{ vehicles?: { make: string; model: string } }> | null
  mileMakersInfo: { current_streak?: number } | null
  availableVehicles: Array<{ make: string; model: string; year: number; daily_rate: number }>
  localEvents: Array<{ event_name: string; demand_level: string }>
}

interface RADChatProps {
  isOpen: boolean
  onClose: () => void
}

export function RADChat({ isOpen, onClose }: RADChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [healthy, setHealthy] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [context, setContext] = useState<RADContext | null>(null)
  const [greetingSent, setGreetingSent] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── MOBILE DETECTION ────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── SCROLL TO BOTTOM every time messages change ──────────────
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    })
    return () => cancelAnimationFrame(frame)
  }, [messages, loading])

  // ── FOCUS INPUT when panel opens ────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 150)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // ── FETCH CONTEXT AND AUTO-GREET when panel opens ──────────
  useEffect(() => {
    if (isOpen && !greetingSent) {
      const page = window.location.pathname
      fetch(`/api/agent/context?page=${encodeURIComponent(page)}`)
        .then(r => r.json())
        .then(async (ctx: RADContext) => {
          setContext(ctx)

          // Auto-send a greeting request to get personalized opener
          setLoading(true)
          try {
            const res = await fetch("/api/agent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: "__GREETING__",
                agent: "RAD",
                context: ctx,
                conversationHistory: [],
              }),
            })
            const data = await res.json()
            if (data?.response) {
              setMessages([{
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.response,
                ts: new Date(),
              }])
            }
          } catch {
            // Silently fall back — no greeting
          } finally {
            setLoading(false)
            setGreetingSent(true)
          }
        })
        .catch(() => setContext(null))
    }
  }, [isOpen, greetingSent])

  // ── CLEANUP on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  // ── SELF-HEALING: ping /api/agent on failure ─────────────────
  const attemptSend = useCallback(
    async (
      text: string,
      history: Message[],
      attempt = 0
    ): Promise<string | null> => {
      try {
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: text,
            agent: "RAD",
            context: context,
            conversationHistory: history.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const reply =
          data?.response ??
          data?.message ??
          data?.content ??
          data?.result ??
          data?.choices?.[0]?.message?.content

        if (!reply) throw new Error("Empty response")

        setHealthy(true)
        setRetryCount(0)
        return reply

      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return null
        }

        const nextAttempt = attempt + 1
        setRetryCount(nextAttempt)

        if (nextAttempt < 3) {
          const delay = 2000 * Math.pow(2, attempt)
          console.warn(
            `[RADChat] Attempt ${nextAttempt} failed, retrying in ${delay}ms`
          )
          await new Promise((resolve) => {
            retryTimerRef.current = setTimeout(resolve, delay)
          })
          return attemptSend(text, history, nextAttempt)
        }

        setHealthy(false)
        console.error("[RADChat] All retries failed:", err)
        return null
      }
    },
    []
  )

  // ── SEND ─────────────────────────────────────────────────────
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setInput("")
      setLoading(true)

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        ts: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])

      const historyForApi = messages

      const reply = await attemptSend(trimmed, historyForApi)

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          reply ??
          "RAD is temporarily unavailable. Email help@rentanddrive.net for assistance.",
        ts: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
      setLoading(false)
    },
    [loading, messages, attemptSend]
  )

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  if (!isOpen) return null

  // ── DIMENSIONS ───────────────────────────────────────────────
  const NAVBAR_H = 64
  const PANEL_W = isMobile ? "100vw" : "420px"
  const PANEL_H = `calc(100vh - ${NAVBAR_H}px)`

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 39,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="RAD Chat"
        aria-modal="true"
        style={{
          position: "fixed",
          top: NAVBAR_H,
          right: 0,
          width: PANEL_W,
          height: PANEL_H,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.10)",
        }}
      >
        {/* 1. HEADER */}
        <div
          style={{
            flexShrink: 0,
            flexGrow: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid #f3f4f6",
            backgroundColor: "#ffffff",
            minHeight: 60,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: "#CC0000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            R
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              RAD
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {healthy ? "Your rental co-pilot" : "Reconnecting…"}
            </div>
          </div>

          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: healthy ? "#639922" : "#f59e0b",
              flexShrink: 0,
              transition: "background-color 0.3s",
            }}
            title={healthy ? "Connected" : `Retry ${retryCount}/3`}
          />

          <button
            onClick={onClose}
            aria-label="Close RAD chat"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              fontSize: 22,
              lineHeight: 1,
              padding: "2px 6px",
              flexShrink: 0,
              borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* 2. MESSAGES */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Empty state - RAD will auto-greet */}
          {messages.length === 0 && !loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 40,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              <p>Starting conversation with RAD...</p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "14px 14px 2px 14px"
                      : "14px 14px 14px 2px",
                  backgroundColor:
                    msg.role === "user" ? "#CC0000" : "#f3f4f6",
                  color: msg.role === "user" ? "#ffffff" : "#111827",
                  fontSize: 13,
                  lineHeight: 1.55,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  marginTop: 3,
                  paddingLeft: msg.role === "user" ? 0 : 2,
                  paddingRight: msg.role === "user" ? 2 : 0,
                }}
              >
                {msg.ts.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div
              style={{
                display: "flex",
                gap: 5,
                padding: "10px 14px",
                backgroundColor: "#f3f4f6",
                borderRadius: "14px 14px 14px 2px",
                alignSelf: "flex-start",
                width: "fit-content",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#9ca3af",
                    animation: `radBounce 1.2s ease-in-out ${
                      i * 0.2
                    }s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Retry notice */}
          {retryCount > 0 && retryCount < 3 && (
            <div
              style={{
                fontSize: 11,
                color: "#f59e0b",
                textAlign: "center",
                padding: "4px 0",
              }}
            >
              Reconnecting… attempt {retryCount} of 3
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} style={{ height: 1, flexShrink: 0 }} />
        </div>

        {/* 3. INPUT BAR */}
        <div
          style={{
            flexShrink: 0,
            flexGrow: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderTop: "1px solid #f3f4f6",
            backgroundColor: "#ffffff",
            minHeight: 60,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder="Ask me anything about RAD…"
            aria-label="Message RAD"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "9px 13px",
              fontSize: 13,
              color: "#111827",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              outline: "none",
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor:
                input.trim() && !loading ? "#CC0000" : "#f9fafb",
              border: "1px solid #e5e7eb",
              cursor:
                input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.15s",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M14 8L2 2l3 6-3 6 12-6z"
                fill={
                  input.trim() && !loading ? "#ffffff" : "#9ca3af"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes radBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  )
}
