'use client'

import { Truck, ShieldCheck, RefreshCw, Gem } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export function TrustBadges() {
  const { t } = useTranslation()

  const badges = [
    {
      icon: Truck,
      title: t('trust.shipping'),
      desc: t('trust.shippingDesc'),
    },
    {
      icon: ShieldCheck,
      title: t('trust.warranty'),
      desc: t('trust.warrantyDesc'),
    },
    {
      icon: RefreshCw,
      title: t('trust.returns'),
      desc: t('trust.returnsDesc'),
    },
    {
      icon: Gem,
      title: t('trust.silver'),
      desc: t('trust.silverDesc'),
    },
  ]

  return (
    <section className="bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {badges.map((b) => (
            <div key={b.title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-navy/5 border border-gold/20 flex items-center justify-center">
                <b.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-navy mb-0.5">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
