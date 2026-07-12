'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Loader2, Diamond, ConciergeBell, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/format'
import { useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'

type ProductLink = { name: string; slug: string; price: number; imageUrl: string; id: string }
type Message = { role: 'user' | 'assistant'; content: string; products?: ProductLink[] }

function renderTextWithLinks(text: string, onProductClick: (slug: string) => void, onCategoryClick: (slug: string) => void) {
  const parts = text.split(/(\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    const match = part.match(/\[(.+?)\]\((.+?)\)/)
    if (match) {
      const href = match[2]
      const productMatch = href.match(/^#product:(.+)$/)
      const catMatch = href.match(/^#category:(.+)$/)
      if (productMatch) {
        return (
          <button
            key={i}
            onClick={() => onProductClick(productMatch[1])}
            className="text-gold-soft underline decoration-gold/30 hover:decoration-gold transition-all font-medium inline"
          >
            {match[1]}
          </button>
        )
      }
      if (catMatch) {
        return (
          <button
            key={i}
            onClick={() => onCategoryClick(catMatch[1])}
            className="text-gold-soft underline decoration-gold/30 hover:decoration-gold transition-all font-medium inline"
          >
            {match[1]}
          </button>
        )
      }
      const url = href.startsWith('/') ? href : `/${href}`
      return (
        <a key={i} href={url} target="_self" className="text-gold-soft underline decoration-gold/30 hover:decoration-gold transition-all font-medium">
          {match[1]}
        </a>
      )
    }
    return <span key={i}>{part}</span>
  })
}

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

function DiamondDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="h-2 w-2 rounded-full inline-block"
      style={{ background: 'linear-gradient(135deg, #f5e6b8, #d4af37)' }}
      animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 0.8, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

export function ConciergeChat() {
  const { t, locale } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ ...GREETING, content: t(GREETING.content) }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [conversationId, setConversationIdState] = useState<string | null>(null)
  const { conciergeProduct, setProductModal } = useUI()

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, messages])

  useEffect(() => {
    const saved = localStorage.getItem('website-chat-conversation-id')
    if (saved) setConversationIdState(saved)
  }, [])

  useEffect(() => {
    if (!conversationId) return

    const eventSource = new EventSource(`/api/chat/stream?conversationId=${conversationId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.message.content,
            },
          ])
        }
      } catch {
        // ignore parse errors
      }
    }

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [conversationId])

  const handleProductClick = (slug: string) => {
    const product = [...(messages.flatMap(m => m.products || []))].find(p => p.slug === slug)
    if (product) {
      setProductModal(product.id)
      setOpen(false)
    }
  }

  const handleCategoryClick = (slug: string) => {
    window.dispatchEvent(new CustomEvent('gg:select-category', { detail: slug }))
    setOpen(false)
    window.location.hash = 'collections'
  }

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
          locale,
          conversationId,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply, products: data.products }])
        if (data.conversationId) {
          setConversationIdState(data.conversationId)
          localStorage.setItem('website-chat-conversation-id', data.conversationId)
        }
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
        className="fixed bottom-5 left-5 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-navy to-navy-deep text-silver shadow-2xl flex items-center justify-center hover:gold-shadow transition-shadow duration-300 ring-2 ring-gold/30 hover:ring-gold/60 press"
        aria-label={t('concierge.openChat')}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <ConciergeBell className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gold ring-2 ring-background" />
        )}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gold/20 animate-ping pointer-events-none" style={{ animationDuration: '2.5s' }} />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95, originX: 0, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-24 left-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[380px] max-h-[75vh] bg-background/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gold/10 overflow-hidden flex flex-col"
            style={{ boxShadow: '0 25px 60px -12px rgba(11, 31, 58, 0.35), 0 0 0 1px rgba(212, 175, 55, 0.06)' }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-navy-deep via-navy to-navy-soft text-silver p-4 flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
              </div>
              <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-gold" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-navy-deep" />
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="font-display text-base font-semibold leading-tight flex items-center gap-2">
                  {t('concierge.title')}
                  <Diamond className="h-3 w-3 text-gold" />
                </p>
                <p className="text-[11px] text-silver/60 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
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
                className="h-8 w-8 rounded-full hover:bg-silver/10 flex items-center justify-center flex-shrink-0 transition-colors press"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-luxury p-4 space-y-3 bg-gradient-to-b from-silver/20 to-background min-h-[260px] max-h-[40vh]">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={cn('flex items-end gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {m.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-navy-deep flex items-center justify-center flex-shrink-0 mb-0.5">
                      <Sparkles className="h-3 w-3 text-gold" />
                    </div>
                  )}
                  <div className="max-w-[85%] flex flex-col gap-2">
                    <div
                      className={cn(
                        'px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        m.role === 'user'
                          ? 'bg-navy text-silver rounded-2xl rounded-br-sm'
                          : 'bg-white/80 backdrop-blur border border-gold/10 text-navy rounded-2xl rounded-bl-sm'
                      )}
                    >
                      {m.role === 'user' ? m.content : renderTextWithLinks(m.content, handleProductClick, handleCategoryClick)}
                    </div>
                    {m.products && m.products.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-0.5 mt-1">
                        {m.products.map((p) => (
                          <button
                            key={p.slug}
                            onClick={() => handleProductClick(p.slug)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-gold/15 text-xs text-navy hover:bg-navy hover:text-silver transition-all press group shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-md bg-silver/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <ExternalLink className="w-4 h-4 text-gold-soft" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium leading-tight truncate max-w-[120px]">{p.name}</p>
                              <p className="text-gold-soft text-[10px]">${p.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-end gap-2">
                  <div className="h-6 w-6 rounded-full bg-navy-deep flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Sparkles className="h-3 w-3 text-gold" />
                  </div>
                  <div className="bg-white/80 backdrop-blur border border-gold/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                    <DiamondDot delay={0} />
                    <DiamondDot delay={0.15} />
                    <DiamondDot delay={0.3} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => send(t(s))}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gold/10 to-gold/5 text-xs text-navy hover:from-gold hover:to-gold-soft hover:text-navy-deep transition-all duration-200 border border-gold/20 press text-left"
                  >
                    {t(s)}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="p-3 border-t border-gold/10 bg-white/50 backdrop-blur flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('concierge.placeholder')}
                className="flex-1 bg-secondary/60 rounded-full px-4 py-2.5 text-sm text-navy placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold/40 transition-all border border-transparent focus:border-gold/20"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || loading}
                whileTap={{ scale: 0.9 }}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-gold to-gold-soft text-navy-deep flex items-center justify-center hover:gold-shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 press"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
