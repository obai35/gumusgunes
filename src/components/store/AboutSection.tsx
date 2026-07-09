'use client'

import { motion } from 'framer-motion'
import { GlowReveal } from './GlowReveal'
import { Sparkles, Gem, Sun, Award } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

const pillars = [
  {
    icon: Gem,
    title: 'about.pillar1Title',
    desc: 'about.pillar1Desc',
  },
  {
    icon: Sun,
    title: 'about.pillar2Title',
    desc: 'about.pillar2Desc',
  },
  {
    icon: Award,
    title: 'about.pillar3Title',
    desc: 'about.pillar3Desc',
  },

]

export function AboutSection() {
  const { t } = useTranslation()
  return (
    <GlowReveal><section id="about" className="py-20 sm:py-28 bg-background scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden luxury-shadow">
              <img
                src="/products/about-craft.jpg"
                alt="Master artisan crafting stainless steel accessories"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/60 via-transparent to-transparent" />
            </div>

            {/* Floating quote card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-6 -right-4 sm:-right-8 max-w-xs bg-navy text-silver p-5 rounded-2xl shadow-xl"
            >
              <div className="text-gold mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="font-display text-sm leading-relaxed italic">
                {t('about.quote')}
              </p>
              <p className="text-xs text-silver/60 mt-2 tracking-wide">{t('about.attribution')}</p>
            </motion.div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block">
              <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{t('about.ourStory')}</span>
              <div className="h-px gold-line mt-2" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4 mb-6 leading-tight">
              {t('about.heading')} {t('about.headingGold')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {t('about.subheading')}
              </p>
              <p>{t('about.aboutParagraph1')}</p>
              <p>{t('about.aboutParagraph2')}</p>
            </div>

            {/* Pillars */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {pillars.map((p) => (
                <div key={t(p.title)} className="flex gap-3 p-4 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-navy/5 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <p.icon className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-navy mb-0.5">{t(p.title)}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(p.desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section></GlowReveal>
  )
}
