'use client'

import { motion } from 'framer-motion'
import { GlowReveal } from './GlowReveal'
import { Star, Quote } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

const testimonials = [
  {
    name: 'Elif Kaya',
    location: 'Istanbul, TR',
    rating: 5,
    text: 'The Sunburst pendant is even more beautiful in person. I have worn it every day for six months and the silver has not tarnished at all. The craftsmanship is exceptional.',
    piece: 'Sunburst Silver Pendant Necklace',
    avatar: 'EK',
  },
  {
    name: 'James Whitmore',
    location: 'London, UK',
    rating: 5,
    text: 'I bought the sapphire ring as an engagement gift and she said yes immediately. The packaging alone felt like a luxury experience. Will be back for the wedding bands.',
    piece: 'Sapphire & Diamond Silver Ring',
    avatar: 'JW',
  },
  {
    name: 'Sofia Rossi',
    location: 'Milan, IT',
    rating: 5,
    text: 'As someone who owns a lot of fine jewelry, I was skeptical of stainless steel pieces. Gümüş Güneş changed my mind — the weight, the polish, the design. It feels like a much more expensive piece.',
    piece: 'Diamond Accent Silver Bangle',
    avatar: 'SR',
  },
  {
    name: 'Aylin Demir',
    location: 'Izmir, TR',
    rating: 5,
    text: 'My grandmother gave me her silver locket and now I have my own from Gümüş Güneş. The heart locket holds a photo of my daughter. It is a piece I will pass down.',
    piece: 'Silver Locket Pendant',
    avatar: 'AD',
  },
  {
    name: 'Marcus Chen',
    location: 'Singapore',
    rating: 5,
    text: 'Shipped to Singapore in 4 days, beautifully boxed, and the hoop earrings my wife wanted were perfect. The sun-ray texture is unique — she gets compliments constantly.',
    piece: 'Silver Sun Hoop Earrings',
    avatar: 'MC',
  },
  {
    name: 'Lena Müller',
    location: 'Berlin, DE',
    rating: 5,
    text: 'I treated myself to the matching set for my 30th birthday. It arrived in a gorgeous box with a handwritten note. This is what luxury shopping should feel like.',
    piece: 'Matching Sun Design Jewelry Set',
    avatar: 'LM',
  },
]

export function Testimonials() {
  const { t } = useTranslation()
  return (
    <GlowReveal><section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{t('testimonials.heading')}</span>
            <div className="h-px gold-line mt-2" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4">
            {t('testimonials.headingGold')}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              <strong className="text-navy">{t('testimonials.rating')}</strong> {t('testimonials.fromReviews')}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/60 card-hover relative overflow-hidden"
            >
              <Quote className="absolute top-4 right-4 h-10 w-10 text-gold/10" />

              <div className="flex mb-3">
                {Array.from({ length: testimonial.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>

              <p className="text-sm text-navy/80 leading-relaxed mb-5 relative z-10">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="h-10 w-10 rounded-full bg-navy text-silver flex items-center justify-center font-display text-sm font-semibold">
                  {testimonial.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>

              <p className="text-[11px] text-gold mt-3 tracking-wide">
                {t('testimonials.verified')} {testimonial.piece}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section></GlowReveal>
  )
}
