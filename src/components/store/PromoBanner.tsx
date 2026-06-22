'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function PromoBanner() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl navy-radial text-silver"
        >
          {/* Background image */}
          <div className="absolute inset-0 opacity-30">
            <img
              src="/products/promo-banner.jpg"
              alt="Gümüş Güneş collection"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/80 to-transparent" />
          </div>

          {/* Sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ top: `${20 + (i * 9) % 60}%`, left: `${10 + (i * 13) % 80}%` }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
                transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3 text-gold/70" />
              </motion.div>
            ))}
          </div>

          <div className="relative p-8 sm:p-12 lg:p-16 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 mb-4">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[10px] tracking-[0.25em] uppercase text-gold-soft">Limited Time</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-3">
              <span className="silver-text">The Summer</span>
              <br />
              <span className="gold-text">Solstice Collection</span>
            </h2>
            <p className="text-silver/70 text-base mb-6 max-w-md leading-relaxed">
              Up to 25% off selected pieces that celebrate the longest days of the year.
              Each purchase arrives in our signature gift box.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#collections"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gold text-navy-deep font-semibold text-sm tracking-wide hover:bg-gold-soft transition-all gold-shadow group"
              >
                Shop the Sale
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex items-center gap-3 text-silver/60 text-sm">
                <div className="text-center">
                  <div className="font-display text-2xl gold-text font-semibold">25%</div>
                  <div className="text-[10px] tracking-wide uppercase">Off</div>
                </div>
                <div className="h-8 w-px bg-silver/20" />
                <div className="text-center">
                  <div className="font-display text-2xl gold-text font-semibold">Free</div>
                  <div className="text-[10px] tracking-wide uppercase">Gift Box</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
