'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Sparkles, ChevronDown, ChevronRight, Bot, Check, X, AlertTriangle, Terminal, FileCode, Database } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type PendingAction = {
  index: number
  tool: string
  description: string
  args: Record<string, any>
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  pendingActions?: PendingAction[]
}

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(?:\w+)?\n?([\s\S]*?)```/)
      const code = match ? match[1] : part.slice(3, -3)
      return (
        <pre key={i} className="text-xs bg-navy-deep/90 text-green-400 p-2 rounded-lg overflow-x-auto my-1.5 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      )
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>
  })
}

function getToolIcon(tool: string) {
  switch (tool) {
    case 'readFile':
    case 'writeFile':
    case 'editFile': return <FileCode className="h-3 w-3" />
    case 'runCommand': return <Terminal className="h-3 w-3" />
    case 'dbQuery': return <Database className="h-3 w-3" />
    default: return <AlertTriangle className="h-3 w-3" />
  }
}

export function AdminChat() {
  const { ta } = useAdminTranslate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: ta('Hello! I am your admin assistant. How can I help you manage the store?') }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: [],
          sessionId,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.reply || '' }
        if (data.pendingActions?.length > 0) {
          assistantMsg.pendingActions = data.pendingActions
        }
        setMessages(prev => [...prev, assistantMsg])
        if (data.sessionId) setSessionId(data.sessionId)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: ta('Sorry, I encountered an error. Please try again.') }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: ta('Connection error. Please check your network and try again.') }])
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId])

  const handleApproval = useCallback(async (actionIndex: number, approved: boolean, messageIndex: number) => {
    if (!sessionId) return
    setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, pendingActions: undefined } : m))
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chat/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, actionIndex, approved }),
      })
      const data = await res.json()
      if (data.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else if (data.ok && data.rejected) {
        setMessages(prev => [...prev, { role: 'assistant', content: ta('Action rejected. You can ask the agent to try a different approach.') }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: ta('Failed to process approval.') }])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  return (
    <div className="border-t border-silver/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Bot className="h-4 w-4 text-gold" />
        <span className="font-medium">{ta('AI Assistant')}</span>
        {!open && messages.length > 1 && (
          <span className="ml-auto h-2 w-2 rounded-full bg-gold animate-pulse" />
        )}
      </button>

      {open && (
        <div className="flex flex-col" style={{ height: '320px' }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-3 w-3 text-gold" />
                    </div>
                  )}
                  <div
                    className={`text-xs leading-relaxed px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-gold/10 text-silver'
                        : 'bg-silver/5 text-silver/80'
                    }`}
                  >
                    {renderContent(m.content)}
                  </div>
                </div>

                {Array.isArray(m.pendingActions) && m.pendingActions.length > 0 && (
                  <div className="mt-1.5 ml-8 space-y-1">
                    {m.pendingActions.map((action) => (
                      <div key={action.index} className="flex items-center justify-between bg-navy-soft/30 rounded-lg px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-silver/70">
                          {getToolIcon(action.tool)}
                          <span>{action.description}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproval(action.index, true, i)}
                            disabled={loading}
                            className="h-5 w-5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 flex items-center justify-center disabled:opacity-30"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleApproval(action.index, false, i)}
                            disabled={loading}
                            className="h-5 w-5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center disabled:opacity-30"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-3 w-3 text-gold" />
                </div>
                <div className="bg-silver/5 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {ta('Thinking...')}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); send(input) }}
            className="px-2 pb-2 pt-1 flex items-center gap-1 flex-shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={ta('Ask anything...')}
              className="flex-1 bg-navy-soft/50 rounded-lg px-2.5 py-1.5 text-xs text-silver placeholder:text-silver/30 outline-none focus:ring-1 focus:ring-gold/40 border border-silver/10"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-7 w-7 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold flex items-center justify-center disabled:opacity-30 transition-colors flex-shrink-0"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
