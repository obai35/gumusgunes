'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Crown, Gift, Star } from 'lucide-react'
import { useLoyalty } from '@/lib/store'
import { useHydrated } from '@/hooks/use-hydrated'
import { useTranslation } from '@/hooks/use-translation'
import { cn } from '@/lib/format'

const TIERS = [
  { name: 'Silver', min: 0, color: '#c0c5ce', perk: 'rewards.perkBirthday' },
  { name: 'Gold', min: 500, color: '#d4af37', perk: 'rewards.perkGold' },
  { name: 'Platinum', min: 2000, color: '#e5e4e2', perk: 'rewards.perkPlatinum' },
]

function getTier(points: number) {
  let current = TIERS[0]
  let next = TIERS[1]
  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) {
      current = TIERS[i]
      next = TIERS[i + 1] || null
    }
  }
  return { current, next }
}

export function LoyaltyBadge() {
  const hydrated = useHydrated()
  const { t } = useTranslation()
  const { points } = useLoyalty()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!hydrated) {
    return <div className="h-9 w-16" />
  }

  const { current, next } = getTier(points)
  const progress = next ? ((points - current.min) / (next.min - current.min)) * 100 : 100
  const pointsToNext = next ? next.min - points : 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 h-9 rounded-full bg-navy/5 hover:bg-navy/10 border border-gold/20 transition-colors group"
        aria-label={t('loyalty.yourStatus')}
      >
        <Crown className="h-3.5 w-3.5 text-gold" />
        <span className="text-xs font-semibold text-navy">{points}</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">{t('loyalty.points')}</span>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-background rounded-2xl shadow-xl border border-border overflow-hidden z-50"
          >
            {/* Header */}
            <div className="navy-radial text-silver p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: current.color, background: `${current.color}20` }}
                >
                  <Crown className="h-4 w-4" style={{ color: current.color }} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold leading-tight">{t(`loyalty.${current.name.charAt(0).toLowerCase() + current.name.slice(1)}Member`)}</p>
                  <p className="text-[10px] text-silver/60">{points} {t('loyalty.points')}</p>
                </div>
              </div>
              {next && (
                <>
                  <div className="h-1.5 rounded-full bg-silver/20 overflow-hidden mb-1.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold to-gold-soft"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <p className="text-[10px] text-silver/70">
                    {t('loyalty.pointsToNext', pointsToNext, next.name)}
                  </p>
                </>
              )}
              {!next && (
                <p className="text-[10px] text-gold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t('rewards.maxTier')}
                </p>
              )}
            </div>

            {/* Tiers */}
            <div className="p-3 space-y-1.5">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold px-1 mb-1">{t('rewards.membershipTiers')}</p>
              {TIERS.map((tier) => {
                const reached = points >= tier.min
                const isCurrent = current.name === tier.name
                return (
                  <div
                    key={tier.name}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg transition-colors',
                      isCurrent ? 'bg-gold/10' : 'hover:bg-secondary/50'
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center border flex-shrink-0"
                      style={{
                        borderColor: tier.color,
                        background: reached ? `${tier.color}30` : 'transparent',
                      }}
                    >
                      {reached ? (
                        <Star className="h-3 w-3 fill-current" style={{ color: tier.color }} />
                      ) : (
                        <Crown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-semibold', reached ? 'text-navy' : 'text-muted-foreground')}>
                        {t(`loyalty.${tier.name.charAt(0).toLowerCase() + tier.name.slice(1)}Member`)}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{t(tier.perk)}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{tier.min}+ {t('loyalty.points')}</span>
                  </div>
                )
              })}
            </div>

            {/* Earn more */}
            <div className="p-3 bg-secondary/30 border-t border-border">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Gift className="h-3 w-3 text-gold flex-shrink-0" />
                {t('rewards.earningInfo')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
