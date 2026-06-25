'use client'

import { motion } from 'framer-motion'
import { Crown, Sparkles, Gift, Star, TrendingUp } from 'lucide-react'
import { useLoyalty } from '@/lib/store'
import { useHydrated } from '@/hooks/use-hydrated'
import { useTranslation } from '@/hooks/use-translation'

const TIERS = [
  {
    name: 'Silver',
    min: 0,
    color: '#c0c5ce',
    icon: Star,
    perks: ['rewards.welcomeBonus', 'rewards.birthdayDiscount', 'rewards.earlySale'],
  },
  {
    name: 'Gold',
    min: 500,
    color: '#d4af37',
    icon: Crown,
    perks: ['rewards.gold10Off', 'rewards.freeExpress', 'rewards.priorityConcierge', 'rewards.exclusivePieces'],
  },
  {
    name: 'Platinum',
    min: 2000,
    color: '#e5e4e2',
    icon: Sparkles,
    perks: ['rewards.platinum15Off', 'rewards.firstAccess', 'rewards.privateAtelier', 'rewards.annualGift'],
  },
]

export function RewardsSection() {
  const { t } = useTranslation()
  const hydrated = useHydrated()
  const { points } = useLoyalty()
  const currentTier = [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0]
  const nextTier = TIERS.find((t) => t.min > points)
  const progress = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100

  return (
    <section className="py-20 sm:py-28 bg-secondary/30 relative overflow-hidden">
      {/* Decorative crown glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.08)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{t('rewards.circle')}</span>
            <div className="h-px gold-line mt-2" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4">
            {t('rewards.heading')}
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t('rewards.subheading')}
          </p>
        </div>

        {/* Current status card */}
        {hydrated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-12 bg-navy text-silver rounded-3xl p-6 sm:p-8 luxury-shadow relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3)_0%,transparent_70%)]" />
            </div>
            <div className="relative flex items-center gap-4 mb-5">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center border-2 flex-shrink-0"
                style={{ borderColor: currentTier.color, background: `${currentTier.color}20` }}
              >
                <currentTier.icon className="h-8 w-8" style={{ color: currentTier.color }} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] uppercase text-silver/50">{t('rewards.yourStatusLabel')}</p>
                <p className="font-display text-2xl font-semibold">
                  {t('rewards.' + currentTier.name.toLowerCase())} Member
                </p>
                <p className="text-sm text-gold-soft flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="h-3 w-3" />
                  {points} {t('rewards.points')}
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <div className="flex items-center gap-1 text-xs text-silver/60 justify-end">
                  <TrendingUp className="h-3 w-3 text-gold" />
                  {t('rewards.rate')}
                </div>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div>
                <div className="flex items-center justify-between text-xs text-silver/60 mb-1.5">
                  <span>{t('rewards.' + currentTier.name.toLowerCase())}</span>
                  <span>{nextTier.min - points} {t('rewards.points')} to {t('rewards.' + nextTier.name.toLowerCase())}</span>
                </div>
                <div className="h-2 rounded-full bg-silver/15 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-gold-soft"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            )}
            {!nextTier && (
              <div className="flex items-center gap-2 text-gold text-sm">
                <Sparkles className="h-4 w-4" />
                {t('rewards.maxTierMessage')}
              </div>
            )}
          </motion.div>
        )}

        {/* Tier cards */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {TIERS.map((tier, i) => {
            const reached = hydrated ? points >= tier.min : false
            const isCurrent = hydrated && currentTier.name === tier.name
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`relative bg-card rounded-2xl p-6 border-2 transition-all ${
                  isCurrent
                    ? 'border-gold gold-shadow'
                    : reached
                      ? 'border-gold/30'
                      : 'border-border/60'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold text-navy-deep text-[10px] font-bold tracking-[0.15em] uppercase">
                    {t('rewards.current')}
                  </span>
                )}

                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center border-2 mb-4 mx-auto"
                  style={{
                    borderColor: tier.color,
                    background: reached ? `${tier.color}25` : 'transparent',
                  }}
                >
                  <tier.icon
                    className="h-7 w-7"
                    style={{ color: reached ? tier.color : '#9ca3af' }}
                  />
                </div>

                <h3 className="font-display text-xl font-semibold text-navy text-center mb-1">{t('rewards.' + tier.name.toLowerCase())}</h3>
                <p className="text-xs text-center text-muted-foreground mb-4">
                  {tier.min === 0 ? t('rewards.freeToJoin') : `${tier.min}+ ${t('rewards.points')}`}
                </p>

                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={t(perk)} className="flex items-start gap-2 text-xs text-navy/80">
                      <span
                        className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: reached ? tier.color : '#d1d5db' }}
                      />
                      {t(perk)}
                    </li>
                  ))}
                </ul>

                {!reached && tier.min > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground mt-4 pt-3 border-t border-border/50">
                    <Gift className="h-3 w-3 inline text-gold mr-1" />
                    {t('rewards.unlockAt')} {tier.min} {t('rewards.points')}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 max-w-lg mx-auto">
          {t('rewards.terms')}
          <br />
          <span className="text-gold">{t('rewards.rate')}</span>
        </p>
      </div>
    </section>
  )
}
