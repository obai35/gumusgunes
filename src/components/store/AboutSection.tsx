'use client'

import { motion } from 'framer-motion'
import { Sparkles, Gem, Sun, Award } from 'lucide-react'

const pillars = [
  {
    icon: Gem,
    title: 'Ethically Sourced',
    desc: 'Every diamond and gemstone is conflict-free, traceable from mine to masterpiece.',
  },
  {
    icon: Sun,
    title: 'Hand-Finished',
    desc: 'Each piece is polished and inspected by master artisans in our Istanbul atelier.',
  },
  {
    icon: Award,
    title: 'Certified 925',
    desc: 'Hallmarked sterling silver, certified for purity and stamped with our sun seal.',
  },
  {
    icon: Sparkles,
    title: 'Designed to Last',
    desc: 'Timeless silhouettes engineered for a lifetime of wear, never fast fashion.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 sm:py-28 bg-background scroll-mt-24">
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
                alt="Master artisan crafting silver jewelry"
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
                "Silver is the moon&apos;s gift to the earth. We simply shape its light."
              </p>
              <p className="text-xs text-silver/60 mt-2 tracking-wide">— Founder, Gümüş Güneş</p>
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
              <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">Our Story</span>
              <div className="h-px gold-line mt-2" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4 mb-6 leading-tight">
              Born from the light of the Bosphorus
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Gümüş Güneş — &ldquo;Silver Sun&rdquo; — began in 2019 in a small workshop
                overlooking the Bosphorus, where two generations of silversmiths
                decided to bring the warmth of the Anatolian sun into the cool elegance
                of sterling silver.
              </p>
              <p>
                Every piece we create is a conversation between two elements: the radiant
                güneş (sun) and the luminous gümüş (silver). From the first sketch to the
                final polish, we honor centuries of Turkish jewellery tradition while
                designing for the modern world.
              </p>
              <p>
                We believe luxury should be intimate, not intimidating. Our pieces are made
                to be worn every day — to gather memories, marks, and meaning alongside
                their shine.
              </p>
            </div>

            {/* Pillars */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {pillars.map((p) => (
                <div key={p.title} className="flex gap-3 p-4 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-navy/5 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <p.icon className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-semibold text-navy mb-0.5">{p.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
