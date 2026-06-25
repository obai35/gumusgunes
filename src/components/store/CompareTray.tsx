'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X, ArrowRight } from 'lucide-react'
import { useCompare } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import { useHydrated } from '@/hooks/use-hydrated'

export function CompareTray() {
  const hydrated = useHydrated()
  const { t } = useTranslation()
  const { ids, setOpen, clear, toggle } = useCompare()

  if (!hydrated || ids.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2.5rem)] max-w-md"
      >
        <div className="bg-navy text-silver rounded-2xl shadow-2xl p-3 flex items-center gap-3 ring-1 ring-gold/20">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
              <GitCompare className="h-5 w-5 text-gold" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-tight">{t('compare.compare')}</p>
              <p className="text-[10px] text-silver/50">{ids.length}/3 {t('compare.selected')}</p>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {ids.map((id) => (
              <div
                key={id}
                className="h-9 w-9 rounded-full bg-silver/10 border border-silver/20 flex items-center justify-center text-[10px] font-mono text-silver/60 flex-shrink-0"
              >
                #{id.slice(-3)}
              </div>
            ))}
          </div>

          <button
            onClick={clear}
            className="h-8 w-8 rounded-full hover:bg-silver/10 flex items-center justify-center flex-shrink-0"
            aria-label={t('compare.clearAria')}
          >
            <X className="h-4 w-4" />
          </button>

          <button
            onClick={() => setOpen(true)}
            className="h-9 px-4 rounded-full bg-gold text-navy-deep text-xs font-semibold hover:bg-gold-soft transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            {t('compare.compare')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
