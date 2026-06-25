'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Loader2, Mail } from 'lucide-react'
import { cn } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'

type State = 'idle' | 'loading' | 'done'

export function BackInStockSignup({ productId }: { productId: string }) {
  const { t } = useTranslation()
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setState('loading')
    try {
      const res = await fetch('/api/back-in-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, productId }),
      })
      const data = await res.json()
      if (data.ok) {
        setState('done')
        if (data.alreadyInStock) {
          toast.success(t('backInStock.backInStockSuccess'))
        } else if (data.alreadySubscribed) {
          toast.success(t('backInStock.alreadyListed'))
        } else {
          toast.success(t('backInStock.subscribed'))
        }
      } else {
        toast.error(data.error || t('backInStock.subFail'))
        setState('idle')
      }
    } catch {
      toast.error(t('backInStock.genericError'))
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy">{t('backInStock.success')}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-secondary/40 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Bell className="h-4 w-4 text-gold" />
        </motion.div>
        <p className="text-sm font-semibold text-navy">{t('backInStock.title')}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {t('backInStock.description')}
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('backInStock.placeholder')}
            className="w-full h-10 pl-9 pr-3 rounded-full bg-background border border-border text-sm text-navy placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <button
          type="submit"
          disabled={state === 'loading'}
          className="h-10 px-4 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
        >
          {state === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('backInStock.button')
          )}
        </button>
      </form>
    </div>
  )
}
