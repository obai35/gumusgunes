'use client'

import { motion } from 'framer-motion'
import { PencilRuler, Flame, Sparkles, Gem } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: PencilRuler,
    title: 'Sketch & Design',
    desc: 'Each piece begins as a hand-drawn sketch in our Istanbul atelier, inspired by the sun, moon, and Bosphorus light.',
    duration: '2–3 days',
  },
  {
    number: '02',
    icon: Gem,
    title: 'Stone Selection',
    desc: 'Conflict-free diamonds and ethically sourced gemstones are hand-selected and inspected under loupe by our master gemologist.',
    duration: '1 day',
  },
  {
    number: '03',
    icon: Flame,
    title: 'Casting & Forging',
    desc: '925 sterling silver is cast, forged, and shaped using techniques passed down through three generations of silversmiths.',
    duration: '3–5 days',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Hand Finishing',
    desc: 'Every surface is hand-polished to a mirror shine, hallmarked with our sun seal, and inspected before it reaches you.',
    duration: '2 days',
  },
]

export function CraftsmanshipTimeline() {
  return (
    <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
      {/* Decorative sun rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">The Atelier</span>
            <div className="h-px gold-line mt-2" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4">
            From Sketch to Shine
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Every Gümüş Güneş piece passes through four careful stages of craftsmanship —
            a process that takes up to two weeks and a lifetime of skill.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-px">
            <div className="h-full mx-auto max-w-5xl bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Number circle */}
                <div className="relative z-10 mb-5">
                  <div className="h-24 w-24 rounded-full bg-navy text-silver flex items-center justify-center luxury-shadow relative">
                    <step.icon className="h-9 w-9 text-gold" />
                    {/* Number badge */}
                    <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gold text-navy-deep text-xs font-bold flex items-center justify-center font-display ring-4 ring-background">
                      {step.number}
                    </div>
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full border border-gold/30 animate-ping" style={{ animationDuration: '3s', animationDelay: `${i * 0.5}s` }} />
                  </div>
                </div>

                <h3 className="font-display text-xl font-semibold text-navy mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-xs">
                  {step.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs text-navy font-medium tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {step.duration}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="font-display text-lg text-navy italic mb-1">
            &ldquo;We do not make jewelry to be worn once. We make it to be lived in.&rdquo;
          </p>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            — The Gümüş Güneš Atelier
          </p>
        </motion.div>
      </div>
    </section>
  )
}
