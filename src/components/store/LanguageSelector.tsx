'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Globe } from 'lucide-react'
import { useLocale } from '@/lib/store'
import { LOCALES, type Locale } from '@/lib/i18n/translations'
import { cn } from '@/lib/format'
import { useHydrated } from '@/hooks/use-hydrated'

export function LanguageSelector() {
  const hydrated = useHydrated()
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rtl = locale === 'ar'

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <div className="relative" ref={ref} dir={rtl ? 'rtl' : 'ltr'}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 h-9 rounded-full text-xs font-medium text-navy hover:bg-secondary transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5 text-gold" />
        <span className="font-semibold">{hydrated ? current.label.substring(0, 2).toUpperCase() : 'EN'}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-36 bg-background rounded-xl shadow-xl border border-border overflow-hidden z-50"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code as Locale)
                  setOpen(false)
                  document.documentElement.dir = l.dir
                  document.documentElement.lang = l.code
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors',
                  locale === l.code
                    ? 'bg-gold/10 text-navy font-semibold'
                    : 'text-navy hover:bg-secondary'
                )}
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-gold/70" />
                  {l.label}
                </span>
                {locale === l.code && <Check className="h-3.5 w-3.5 text-gold ml-1" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
