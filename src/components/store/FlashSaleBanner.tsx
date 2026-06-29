'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Sparkles } from 'lucide-react'
import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

// Sale ends 3 days from when the component first mounts (persists in sessionStorage)
function getSaleEnd(): number {
  if (typeof window === 'undefined') return Date.now() + 3 * 24 * 60 * 60 * 1000
  const KEY = 'gg_flash_sale_end'
  let end = window.sessionStorage.getItem(KEY)
  if (!end) {
    end = String(Date.now() + 3 * 24 * 60 * 60 * 1000)
    window.sessionStorage.setItem(KEY, end)
  }
  return parseInt(end)
}

function TimeBox({ value, label }: { value: number; label: string }) {
  const padded = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="bg-navy-deep/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[2.75rem] sm:min-w-[3.25rem] text-center ring-1 ring-gold/30">
          <span className="font-display text-xl sm:text-2xl font-bold silver-text tabular-nums">
            {padded}
          </span>
        </div>
      </div>
      <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-silver/50 mt-1">{label}</span>
    </div>
  )
}

export function FlashSaleBanner() {
  const { t } = useTranslation()
  const [saleEnd, setSaleEnd] = useState<number | null>(null)

  useEffect(() => {
    setSaleEnd(getSaleEnd())
  }, [])

  const { days, hours, minutes, seconds, isExpired } = useCountdown(saleEnd ?? 0)

  if (isExpired || saleEnd === null) return null

  return (
    <section className="py-6 sm:py-8 bg-navy-deep relative overflow-hidden">
      {/* Animated sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: `${10 + (i * 9) % 80}%`, left: `${5 + (i * 11) % 90}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          >
            <Sparkles className="h-2.5 w-2.5 text-gold/50" />
          </motion.div>
        ))}
      </div>

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center">
          {/* Label */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-10 w-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center"
            >
              <Flame className="h-5 w-5 text-gold" />
            </motion.div>
            <div className="text-left">
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold-soft font-medium">{t('flashSale.title')}</p>
              <p className="font-display text-lg sm:text-xl font-semibold text-silver leading-tight">
                <span className="gold-text">{t('flashSale.description')}</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-12 w-px bg-silver/15" />

          {/* Countdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            <TimeBox value={days} label={t('flashSale.days')} />
            <span className="font-display text-xl text-gold/60 -mt-3">:</span>
            <TimeBox value={hours} label={t('flashSale.hrs')} />
            <span className="font-display text-xl text-gold/60 -mt-3">:</span>
            <TimeBox value={minutes} label={t('flashSale.min')} />
            <span className="font-display text-xl text-gold/60 -mt-3">:</span>
            <TimeBox value={seconds} label={t('flashSale.sec')} />
          </div>

          {/* CTA */}
          <a
            href="#bestsellers"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-navy-deep font-semibold text-sm tracking-wide hover:bg-gold-soft transition-all gold-shadow flex-shrink-0"
          >
            {t('flashSale.shopNow')}
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
