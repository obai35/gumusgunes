'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, Check, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'

export function Newsletter() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await res.json()
      if (data.ok) {
        setDone(true)
        toast.success(data.alreadySubscribed ? t('newsletter.alreadySubscribed') : t('newsletter.success'))
        setEmail('')
        setName('')
      } else {
        toast.error(data.error || t('newsletter.subFail'))
      }
    } catch {
      toast.error(t('newsletter.subGenericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 sm:py-28 bg-navy text-silver relative overflow-hidden">
      {/* Decorative sun rays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.10)_0%,transparent_60%)]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-6">
            <Gift className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs tracking-[0.25em] uppercase text-gold-soft">{t('rewards.gold10Off')}</span>
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4">
            <span className="silver-text">{t('newsletter.heading')}</span>{' '}
            <span className="gold-text">{t('newsletter.headingGold')}</span>
          </h2>
          <p className="text-silver/70 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            {t('newsletter.subheading')}
          </p>

          {done ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 px-6 py-4 rounded-full bg-gold/15 border border-gold/40"
            >
              <Check className="h-5 w-5 text-gold" />
                  <span className="text-silver font-medium">{t('newsletter.checkInbox')}</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('newsletter.placeholder')}
                  className="pl-11 h-12 rounded-full bg-silver/10 border-silver/20 text-silver placeholder:text-silver/40 focus-visible:ring-gold"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 rounded-full bg-gold text-navy-deep hover:bg-gold-soft font-semibold tracking-wide"
              >
                {loading ? (
                  <div className="h-4 w-4 rounded-full border-2 border-navy-deep border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
{t('newsletter.subscribe')}
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="text-[11px] text-silver/40 mt-4 tracking-wide">
            {t('newsletter.noSpam')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
