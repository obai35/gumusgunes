'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useCurrencyStore } from '@/lib/currency-store'
import { cn } from '@/lib/format'
import { useHydrated } from '@/hooks/use-hydrated'

export function CurrencySelector() {
  const hydrated = useHydrated()
  const { currencies, selected, setSelected, loadCurrencies } = useCurrencyStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCurrencies()
  }, [loadCurrencies])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 h-9 rounded-full text-xs font-medium text-navy hover:bg-secondary transition-colors"
        aria-label="Select currency"
      >
        <span className="font-semibold">{selected.code}</span>
        <span className="text-gold">{selected.symbol}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-40 bg-background rounded-xl shadow-xl border border-border overflow-hidden z-50"
          >
            {currencies.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setSelected(c.code)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors',
                  selected.code === c.code
                    ? 'bg-gold/10 text-navy font-semibold'
                    : 'text-navy hover:bg-secondary'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-gold font-semibold w-4">{c.symbol}</span>
                  {c.code}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.symbol}
                </span>
                {selected.code === c.code && <Check className="h-3.5 w-3.5 text-gold ml-1" />}
              </button>
            ))}
            <div className="px-3 py-2 bg-secondary/50 text-[10px] text-muted-foreground border-t border-border">
              Rates for reference only
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
