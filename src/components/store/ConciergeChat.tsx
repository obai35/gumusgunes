'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/format'
import { useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'concierge.suggestions.0',
  'concierge.suggestions.1',
  'concierge.suggestions.2',
  'concierge.suggestions.3',
]

const GREETING: Message = {
  role: 'assistant',
  content: 'concierge.greeting',
}

export function ConciergeChat() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ ...GREETING, content: t(GREETING.content) }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { conciergeProduct } = useUI()

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, messages])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: next.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
          productContext: conciergeProduct,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
        if (!open) setUnread(true)
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: t('concierge.errorReply') },
        ])
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: t('concierge.connectionError') },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring', damping: 15 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 left-5 z-40 h-14 w-14 rounded-full bg-navy text-silver shadow-2xl flex items-center justify-center hover:bg-navy-soft transition-colors group ring-4 ring-gold/20 hover:ring-gold/40"
        aria-label={t('concierge.openChat')}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gold animate-pulse" />
        )}
        {/* Pulsing ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gold/30 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-24 left-5 z-40 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[70vh] bg-background rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="navy-radial text-silver p-4 flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-gold" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-navy-deep" />
              </div>
              <div className="flex-1">
                <p className="font-display text-base font-semibold leading-tight">
                  {t('concierge.title')}
                </p>
                <p className="text-[11px] text-silver/60 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {t('concierge.online')}
                </p>
                {conciergeProduct && (
                  <p className="text-[10px] text-gold-soft mt-0.5 line-clamp-1">
                    {t('concierge.viewing')}: {conciergeProduct.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-silver/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-luxury p-4 space-y-3 bg-secondary/20 min-h-[280px] max-h-[40vh]">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'bg-navy text-silver rounded-br-md'
                        : 'bg-card border border-border text-navy rounded-bl-md'
                    )}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-gold"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions (only show before first user message) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(t(s))}
                    className="px-3 py-1.5 rounded-full bg-secondary text-xs text-navy hover:bg-gold hover:text-navy-deep transition-colors border border-border"
                  >
                    {t(s)}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="p-3 border-t border-border bg-background flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('concierge.placeholder')}
                className="flex-1 bg-secondary/50 rounded-full px-4 py-2.5 text-sm text-navy placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-10 w-10 rounded-full bg-gold text-navy-deep flex items-center justify-center hover:bg-gold-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
