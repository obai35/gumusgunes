'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles, Sun } from 'lucide-react'
import { useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'

export function Hero() {
  const { setSearchOpen } = useUI()
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('__PREVIEW_DATA')
      if (el?.textContent) {
        setSettings(JSON.parse(el.textContent))
      }
      return
    }
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .catch(() => {})
  }, [])

  const s = (key: string, fallback: string) => settings[key] || fallback

  return (
    <section id="top" className="relative overflow-hidden navy-radial text-silver">
      {/* Decorative sun rays */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] max-w-[1400px] max-h-[1400px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_60%)]" />
        </div>
      </div>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${15 + (i * 7) % 70}%`,
              left: `${5 + (i * 11) % 90}%`,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, repeatDelay: 2 }}
          >
            <Sparkles className="h-3 w-3 text-gold/60" />
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-6">
              <Sun className="h-3.5 w-3.5 text-gold" />
              <span className="text-xs tracking-[0.25em] uppercase text-gold-soft">
                {t('hero.handcraftedIn')}
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] mb-6">
              <span className="silver-text" data-setting="heroTitle">{s('heroTitle', t('hero.heading1'))}</span>
              <br />
              <span className="gold-text" data-setting="heroSubtitle">{s('heroSubtitle', t('hero.heading2'))}</span>
            </h1>

            <p className="text-base sm:text-lg text-silver/70 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              <span data-setting="heroDescription">{s('heroDescription', t('hero.heroDescription'))}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <a
                href="#collections"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold text-navy-deep font-semibold text-sm tracking-wide hover:bg-gold-soft transition-all gold-shadow"
              >
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <button
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-silver/30 text-silver hover:border-gold hover:text-gold transition-all text-sm font-medium tracking-wide"
              >
                {t('hero.searchVault')}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-silver/10 max-w-md mx-auto lg:mx-0">
              {[
                { value: '15K+', label: t('hero.stat1') },
                { value: '4.9★', label: t('hero.stat2') },
                { value: '100%', label: t('hero.stat3') },
              ].map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="font-display text-2xl sm:text-3xl gold-text font-semibold">{s.value}</div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-silver/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Decorative ring */}
              <div className="absolute -inset-4 rounded-full border border-gold/20" />
              <div className="absolute -inset-8 rounded-full border border-gold/10" />

              {/* Glow */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3)_0%,transparent_70%)] blur-2xl" />

              {/* Image */}
              <div className="relative h-full w-full rounded-full overflow-hidden ring-1 ring-gold/40 luxury-shadow">
                <img
                  src="/products/hero-necklace.jpg"
                  alt="Gümüş Güneş signature silver necklace with diamond sun pendant"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/40 via-transparent to-transparent" />
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-2 -left-2 sm:-left-6 bg-background text-navy rounded-2xl shadow-xl p-4 max-w-[180px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{t('hero.badge1')}</span>
                </div>
                <p className="font-display text-sm font-semibold leading-tight">{t('hero.badge2')}</p>
                <p className="text-xs text-gold mt-0.5">{t('hero.badge3')}</p>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-background pointer-events-none" />
    </section>
  )
}
